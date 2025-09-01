'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Play, Pause, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  }>;
}

interface ChatInterfaceProps {
  sessionId: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  onMessageSent?: (message: Message) => void;
  isContinueSession?: boolean;
}

export default function ChatInterface({ 
  sessionId, 
  mode, 
  language, 
  onMessageSent,
  isContinueSession = false
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const lastSpokenIdRef = useRef<string | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    scrollToBottomImmediate();
  }, [messages, isTyping]);

  // Auto-speak AI responses in voice mode
  useEffect(() => {
    if (mode === 'voice' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage._id !== lastSpokenIdRef.current) {
        lastSpokenIdRef.current = lastMessage._id;
        // Small delay to ensure the message is rendered
        setTimeout(() => {
          speakText(lastMessage.contentText, lastMessage._id);
        }, 500);
      }
    }
  }, [messages, mode, language]);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Initialize Speech Recognition when in voice mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load speech synthesis voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Loaded voices:', voices.map(v => `${v.name} (${v.lang})`));
    };
    
    // Load voices when they become available
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Load voices immediately if already available
    loadVoices();
    
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupportsSpeech(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
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

  // Auto-voice for continue sessions
  useEffect(() => {
    if (isContinueSession) {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistant) return;
      if (lastSpokenIdRef.current === lastAssistant._id) return;
      lastSpokenIdRef.current = lastAssistant._id;
      speakText(lastAssistant.contentText);
    }
  }, [messages, isContinueSession]);

  const speakText = (text: string, messageId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('Speech synthesis not available');
      return;
    }
    
    window.speechSynthesis.cancel();
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language and try to find appropriate voice
      let targetLang = 'en-US';
      if (language === 'hi') {
        targetLang = 'hi-IN';
      } else if (language === 'mr') {
        targetLang = 'mr-IN';
      }
      
      utterance.lang = targetLang;
      
      // Try to find a voice for the target language
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      let targetVoice = null;
      if (language === 'hi') {
        targetVoice = voices.find(voice => 
          voice.lang.includes('hi') || voice.lang.includes('Hindi') || voice.name.includes('Hindi')
        );
      } else if (language === 'mr') {
        targetVoice = voices.find(voice => 
          voice.lang.includes('mr') || voice.lang.includes('Marathi') || voice.name.includes('Marathi')
        );
        // If no Marathi voice found, try Hindi as fallback
        if (!targetVoice) {
          targetVoice = voices.find(voice => 
            voice.lang.includes('hi') || voice.lang.includes('Hindi')
          );
        }
      } else {
        targetVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.lang.includes('US')
        );
      }
      
      if (targetVoice) {
        utterance.voice = targetVoice;
        console.log(`Using voice: ${targetVoice.name} (${targetVoice.lang})`);
      } else {
        console.log(`No specific voice found for ${language}, using default`);
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      if (messageId) {
        setPlayingMessageId(messageId);
      }
      
      utterance.onstart = () => {
        console.log(`Started speaking in ${language}: ${text.substring(0, 50)}...`);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setPlayingMessageId(null);
      };
      
      utterance.onerror = (event) => {
        console.error('TTS error:', event);
        setPlayingMessageId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setPlayingMessageId(null);
      console.error('TTS error:', e);
    }
  };

  const playMessage = (message: Message) => {
    if (playingMessageId === message._id) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    } else {
      speakText(message.contentText, message._id);
    }
  };

  // Test TTS function for debugging
  const testTTS = () => {
    const testText = language === 'mr' ? 'नमस्कार, मी तुमची मदत करत आहे' : 
                    language === 'hi' ? 'नमस्ते, मैं आपकी मदद कर रहा हूं' : 
                    'Hello, I am here to help you';
    speakText(testText, 'test');
  };

  // Generate summary on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      void generateAndStoreSummary();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void generateAndStoreSummary();
    };
  }, [sessionId, language, messages.length]);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const scrollToBottomImmediate = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'auto',
          block: 'end',
          inline: 'nearest'
        });
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
        
        setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));
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
    <div className="flex justify-start mb-4">
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-[80%]">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {language === 'hi' ? 'AI टाइप कर रहा है...' : 
           language === 'mr' ? 'AI टाइप करत आहे...' : 
           'AI is typing...'}
        </span>
      </div>
    </div>
  );

  // Video suggestions component - removed as per user preference
  const VideoSuggestions = ({ videos }: { videos: Message['videoSuggestions'] }) => {
    return null; // Video suggestions removed as per user preference
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-white dark:bg-gray-900 min-h-0">
        {isLoading ? (
          <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-xs sm:text-sm">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 mt-8 px-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {language === 'hi' ? 'मैं आपकी कैसे मदद कर सकता हूं?' : 
               language === 'mr' ? 'मी तुमची कशी मदत करू शकतो?' : 
               'What can I help with?'}
            </h1>
            <p className="text-xs sm:text-sm">
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
                <div className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <div className="text-xs sm:text-sm leading-relaxed">
                      {message.contentText}
                    </div>
                    {message.role === 'assistant' && message.videoSuggestions && (
                      <VideoSuggestions videos={message.videoSuggestions} />
                    )}
                  </div>
                  <div className={`flex items-center justify-between mt-1 sm:mt-2 text-xs ${
                    message.role === 'user' ? 'text-gray-500 dark:text-gray-400 justify-end' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    <span className="text-xs">{new Date(message.createdAt).toLocaleTimeString()}</span>
                    {message.role === 'assistant' && !isContinueSession && (
                      <button 
                        onClick={() => playMessage(message)}
                        className={`ml-2 p-1 rounded touch-button ${
                          playingMessageId === message._id 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        title={playingMessageId === message._id ? 'Stop' : 'Play'}
                      >
                        {playingMessageId === message._id ? 
                          <Pause size={10} className="sm:w-3 sm:h-3" /> : 
                          <Play size={10} className="sm:w-3 sm:h-3" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === 'hi' 
                    ? 'अपना संदेश यहाँ लिखें...' 
                    : language === 'mr'
                    ? 'तुमचा संदेश येथे लिहा...'
                    : 'Ask anything'
                }
                className="w-full p-2 sm:p-3 pr-10 sm:pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                disabled={isSending}
                style={{ minHeight: '44px', maxHeight: '200px' }}
              />
              <div className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-500 dark:text-gray-400">
                <Plus size={14} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              {mode === 'voice' && (
                <button
                  onClick={toggleRecording}
                  className={`p-2 sm:p-3 rounded-lg touch-button ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                  disabled={!supportsSpeech}
                >
                  {isRecording ? <MicOff size={18} className="sm:w-5 sm:h-5" /> : <Mic size={18} className="sm:w-5 sm:h-5" />}
                </button>
              )}
              <button
                onClick={testTTS}
                className="p-2 sm:p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white touch-button"
                title="Test TTS"
              >
                🔊
              </button>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="p-2 sm:p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-button"
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          {/* Mode and Language Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-2 sm:space-y-0">
            <div className="flex flex-wrap space-x-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                {mode === 'voice' ? 'Voice' : 'Text'}
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                {language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}
              </span>
            </div>
            <button
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-xs"
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
