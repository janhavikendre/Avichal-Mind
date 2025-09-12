'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Play, Pause, Plus, Scissors, Check, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CrisisVideoSupport } from '@/components/ui/crisis-video-support';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  contentText: string;
  contentAudioUrl?: string;
  createdAt: string;
  videoSuggestions?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    url: string;
    duration?: string;
    category?: string;
    language?: string;
    priority?: string;
  }>;
  isCrisisResponse?: boolean;
  crisisType?: string;
  crisisSeverity?: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  onMessageSent?: (message: Message) => void;
  isContinueSession?: boolean;
  user?: any;
  isSidebarVisible?: boolean;
  onModeChange?: (mode: 'text' | 'voice') => void;
  onLanguageChange?: (language: 'en' | 'hi' | 'mr') => void;
}

export default function ChatInterface({ 
  sessionId, 
  mode, 
  language, 
  onMessageSent,
  isContinueSession = false,
  user,
  isSidebarVisible = true,
  onModeChange,
  onLanguageChange
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const lastSpokenIdRef = useRef<string | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    scrollToBottomImmediate();
  }, [messages, isTyping]);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Initialize Speech Recognition when in voice mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupportsSpeech(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        
        if (finalText) {
          accumulatedTranscriptRef.current += finalText;
          setNewMessage(accumulatedTranscriptRef.current);
        } else {
          setNewMessage(accumulatedTranscriptRef.current + interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (isRecording) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Error restarting recognition:', e);
            setIsRecording(false);
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSupportsSpeech(false);
    }
  }, [language, mode, isRecording]);

  const loadMessages = async () => {
    try {
      let apiUrl = `/api/session/${sessionId}`;
      if (user && user.userType === 'phone') {
        apiUrl += `?phoneUserId=${user._id}`;
      }
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setSession(data.session);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottomImmediate = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    }, 50);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setIsTyping(true);
    const userMessage = newMessage.trim();
    setNewMessage('');

    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      contentText: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const requestBody = {
        content: userMessage,
        isAudio: false,
        ...(user && user.userType === 'phone' ? { phoneUserId: user._id } : {}),
      };
      
      const response = await fetch(`/api/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id).concat([data.userMessage, data.assistantMessage]));
        onMessageSent?.(data.assistantMessage);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    if (mode !== 'voice') return;
    if (!supportsSpeech || !recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast('Recording stopped');
    } else {
      setNewMessage('');
      accumulatedTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
      setIsRecording(true);
      toast('Recording started');
    }
  };

  const cutRecording = () => {
    if (mode !== 'voice') return;
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    setNewMessage('');
    accumulatedTranscriptRef.current = '';
    toast('Recording discarded');
  };

  const stopAndSendRecording = async () => {
    if (mode !== 'voice') return;
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    const finalText = (newMessage.trim() || accumulatedTranscriptRef.current.trim());
    accumulatedTranscriptRef.current = '';
    if (!finalText) return;
    setNewMessage(finalText);
    await sendMessage();
  };

  const getTranscriptText = (): string => {
    return messages
      .map(m => `${m.role === 'assistant' ? 'AI' : 'You'}: ${m.contentText}`)
      .join('\n');
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[80%] shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">AI is thinking</span>
            <div className="flex space-x-1 ml-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {session?.title || 'Chat Session'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'hi' 
                    ? 'आपकी सहायता के लिए यहाँ हैं' 
                    : language === 'mr'
                    ? 'तुमच्या मदतीसाठी येथे आहोत'
                    : 'We are here to help you'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={language}
                onChange={(e) => onLanguageChange?.(e.target.value as 'en' | 'hi' | 'mr')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
              </select>
              <select
                value={mode}
                onChange={(e) => onModeChange?.(e.target.value as 'text' | 'voice')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="text">
                  {language === 'hi' ? 'टेक्स्ट' : language === 'mr' ? 'मजकूर' : 'Text'}
                </option>
                <option value="voice">
                  {language === 'hi' ? 'आवाज़' : language === 'mr' ? 'आवाज' : 'Voice'}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0"></div>
            </div>
            <p className="text-sm font-medium mt-4">Loading conversation...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait while we prepare your session</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-12 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {user?.firstName 
                  ? (language === 'hi' ? `नमस्ते, ${user.firstName}!` : 
                     language === 'mr' ? `नमस्कार, ${user.firstName}!` : 
                     `Hello, ${user.firstName}!`)
                  : (language === 'hi' ? 'नमस्ते!' : 
                     language === 'mr' ? 'नमस्कार!' : 
                     'Hello!')
                }
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                {language === 'hi' ? 'मैं आपकी कैसे मदद कर सकता हूं?' : 
                 language === 'mr' ? 'मी तुमची कशी मदत करू शकतो?' : 
                 'How can I help you today?'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'hi' ? 'अपनी मानसिक स्वास्थ्य यात्रा शुरू करें...' : 
                 language === 'mr' ? 'तुमचा मानसिक आरोग्य प्रवास सुरू करा...' : 
                 'Start your mental wellness conversation below'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-xs sm:max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl rounded-br-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-3xl rounded-bl-lg border border-gray-200 dark:border-gray-700 shadow-sm'
                  } p-4 sm:p-6`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {message.contentText}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3 sm:space-x-4">
            <div className="flex-1 relative">
              <div className="relative bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    language === 'hi' 
                      ? 'अपना संदेश यहाँ लिखें...' 
                      : language === 'mr'
                      ? 'तुमचा संदेश येथे लिहा...'
                      : 'Type your message here...'
                  }
                  className="w-full p-4 bg-transparent resize-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl"
                  rows={1}
                  disabled={isSending}
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              {mode === 'voice' ? (
                isRecording ? (
                  <>
                    <button
                      onClick={cutRecording}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200 shadow-md"
                      title="Cancel recording"
                    >
                      <Scissors className="w-5 h-5" />
                    </button>
                    <button
                      onClick={stopAndSendRecording}
                      className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors duration-200 shadow-md"
                      title="Send recording"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={toggleRecording}
                    disabled={!supportsSpeech}
                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 shadow-md"
                    title="Start voice recording"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors duration-200 disabled:cursor-not-allowed shadow-md"
                  title="Send message"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Language and Mode Info */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex space-x-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                {mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
              </span>
            </div>
            <button
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              onClick={() => {
                const blob = new Blob([getTranscriptText()], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `session-${sessionId}-transcript.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              Download Transcript
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
