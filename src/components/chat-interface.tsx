'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  contentText: string;
  contentAudioUrl?: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  onMessageSent?: (message: Message) => void;
}

export default function ChatInterface({ 
  sessionId, 
  mode, 
  language, 
  onMessageSent 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    scrollToBottom();
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
      recognition.continuous = true; // keep listening across short pauses
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            accumulatedTranscriptRef.current += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        const combined = (accumulatedTranscriptRef.current + interim).trim();
        setNewMessage(combined);
      };

      recognition.onerror = () => {
        toast.error('Microphone error. Please check permissions.');
        setIsRecording(false);
      };

      recognition.onend = async () => {
        // Chrome stops after short silence; auto-restart if still recording
        if (isRecording) {
          try {
            recognition.start();
          } catch (_) {
            // ignore if already started
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSupportsSpeech(false);
    }
  }, [language, mode]);

  // Speak assistant replies (both modes)
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant) return;
    if (lastSpokenIdRef.current === lastAssistant._id) return;
    lastSpokenIdRef.current = lastAssistant._id;
    speakText(lastAssistant.contentText);
  }, [messages, mode]);

  const speakText = (text: string) => {
    if (typeof window === 'undefined') return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore TTS errors silently
    }
  };

  // Generate summary on unmount (end of session) and expose transcript download
  useEffect(() => {
    const handleBeforeUnload = () => {
      void generateAndStoreSummary();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void generateAndStoreSummary();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, language, messages.length]);

  const getTranscriptText = (): string => {
    return messages
      .map(m => `${m.role === 'assistant' ? 'AI' : 'You'}: ${m.contentText}`)
      .join('\n');
  };

  const generateAndStoreSummary = async () => {
    try {
      await fetch(`/api/session/${sessionId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
        keepalive: true
      });
    } catch (_) {
      // best-effort; ignore errors during unload
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
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

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setIsTyping(true);
    const userMessage = newMessage.trim();
    setNewMessage('');

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      contentText: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage,
          isAudio: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Remove temp message and add real messages
        setMessages(prev => {
          const filtered = prev.filter(msg => msg._id !== tempUserMessage._id);
          return [...filtered, {
            _id: `user-${Date.now()}`,
            role: 'user',
            contentText: userMessage,
            createdAt: new Date().toISOString(),
          }, data.message];
        });

        if (onMessageSent) {
          onMessageSent(data.message);
        }
      } else {
        const errorData = await response.json();
        if (errorData.error === 'crisis_detected') {
          toast.error('Crisis detected. Please contact support immediately.');
        } else {
          toast.error('Failed to send message');
        }
        
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove temp message on error
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
      // Don't auto-send - just stop recording and let user review/edit text
      const finalText = newMessage.trim() || accumulatedTranscriptRef.current.trim();
      if (finalText.length > 0) {
        setNewMessage(finalText);
      }
      accumulatedTranscriptRef.current = '';
    } else {
      setNewMessage('');
      accumulatedTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (_) {
        // ignore start errors
      }
      setIsRecording(true);
      toast('Recording started');
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start">
      <Card className="max-w-[85%] sm:max-w-[80%] bg-gray-100 dark:bg-gray-700 dark:text-white">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'hi' ? 'AI टाइप कर रहा है...' : 
               language === 'mr' ? 'AI टाइप करत आहे...' : 
               'AI is typing...'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-sm sm:text-base">Start your conversation here...</p>
            <p className="text-xs sm:text-sm mt-2">
              {language === 'hi' ? 'अपनी बातचीत यहाँ शुरू करें...' : 
               language === 'mr' ? 'तुमची संवाद येथे सुरू करा...' : 
               'Begin your wellness journey'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[85%] sm:max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                }`}>
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm">{message.contentText}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'assistant' && message.contentAudioUrl && (
                        <Button className="text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white p-1 sm:p-2">
                          🔊
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex space-x-2">
          <div className="flex-1">
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
              className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={2}
              disabled={isSending}
            />
          </div>
          <div className="flex flex-col space-y-2">
            {mode === 'voice' && (
              <Button
                onClick={toggleRecording}
                className={`h-8 w-8 sm:h-10 sm:w-10 p-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              >
                {isRecording ? <MicOff size={14} className="sm:w-4 sm:h-4" /> : <Mic size={14} className="sm:w-4 sm:h-4" />}
              </Button>
            )}
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send size={14} className="sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        {/* Mode and Language Badges */}
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {mode === 'voice' ? 'Voice' : 'Text'}
          </Badge>
          <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}
          </Badge>
          <Button
            className="ml-auto bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-xs sm:text-sm"
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
          </Button>
        </div>
      </div>
    </div>
  );
}
