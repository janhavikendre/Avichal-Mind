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
  const [hasVoiceTranscript, setHasVoiceTranscript] = useState(false);
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
      // Fixed: Set continuous to false to prevent word repetition
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
      // Fixed: Add maxAlternatives to get better results
      recognition.maxAlternatives = 1;

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
        
        // Fixed: Only update with final text to prevent repetition
        if (finalText) {
          accumulatedTranscriptRef.current += finalText + ' ';
          setNewMessage(accumulatedTranscriptRef.current.trim());
          setHasVoiceTranscript(true); // Mark that we have a voice transcript ready
        } else if (interim) {
          // Show interim results but don't accumulate them
          setNewMessage(accumulatedTranscriptRef.current.trim() + ' ' + interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        // Fixed: Clear accumulated text on error
        accumulatedTranscriptRef.current = '';
        setHasVoiceTranscript(false);
      };

      recognition.onend = () => {
        // Fixed: Don't auto-restart, let user control recording
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSupportsSpeech(false);
    }
  }, [language, mode]);

  // Enhanced Text-to-speech function for AI responses
  const speakTextImproved = (text: string) => {
    if (typeof window === 'undefined' || !text || !text.trim()) {
      console.log('❌ TTS: Invalid text or window unavailable');
      return;
    }
    
    console.log('🔊 TTS: Starting speech for:', text.substring(0, 50) + '...');
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Fixed: Preprocess text to prevent inappropriate sentence cutting
      const preprocessTextForTTS = (inputText: string): string => {
        let processedText = inputText.trim();
        
        // Fix common sentence cutting issues
        processedText = processedText.replace(/([.!?])\s*([a-zA-Z])/g, '$1 $2');
        processedText = processedText.replace(/([.!?])\s*([अ-ह])/g, '$1 $2');
        
        // Ensure proper spacing around punctuation
        processedText = processedText.replace(/([.!?])([a-zA-Z])/g, '$1 $2');
        processedText = processedText.replace(/([.!?])([अ-ह])/g, '$1 $2');
        
        // Fix spacing issues that cause cutting
        processedText = processedText.replace(/\s+/g, ' ');
        processedText = processedText.replace(/([.!?])\s*$/, '$1');
        
        // Add natural pauses for better speech flow
        if (language === 'hi' || language === 'mr') {
          // For Hindi/Marathi, add slight pauses after sentences
          processedText = processedText.replace(/([.!?])\s/g, '$1 ');
        }
        
        return processedText;
      };
      
      const processedText = preprocessTextForTTS(text);
      
      // Wait for speech synthesis to be ready
      const speakWhenReady = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🎤 Available voices:', voices.length);
        
        if (voices.length === 0) {
          // Voices not loaded yet, try again
          setTimeout(speakWhenReady, 100);
          return;
        }
        
        const utterance = new SpeechSynthesisUtterance(processedText);
        
        // Find appropriate voice based on language
        let selectedVoice = null;
        if (language === 'hi') {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('hi') || voice.name.toLowerCase().includes('hindi')
          ) || voices.find(voice => voice.lang.includes('en-IN'));
          utterance.lang = 'hi-IN';
          utterance.rate = 1.05;
        } else if (language === 'mr') {
          // Use Hindi voice for Marathi (better compatibility)
          selectedVoice = voices.find(voice => 
            voice.lang.includes('hi') || voice.name.toLowerCase().includes('hindi')
          ) || voices.find(voice => voice.lang.includes('en-IN'));
          utterance.lang = 'hi-IN';
          utterance.rate = 1.15;
        } else {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
          ) || voices.find(voice => voice.lang.includes('en'));
          utterance.lang = 'en-US';
          utterance.rate = 1.0;
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('🎯 Selected voice:', selectedVoice.name, selectedVoice.lang);
        } else {
          console.log('⚠️ No specific voice found, using default');
        }
        
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Fixed: Add better event handling to prevent cutting
        utterance.onstart = () => {
          console.log('✅ TTS: Speech started');
        };
        
        utterance.onend = () => {
          console.log('✅ TTS: Speech ended');
        };
        
        utterance.onerror = (event) => {
          console.error('❌ TTS Error:', event.error);
        };
        
        utterance.onpause = () => {
          console.log('⏸️ TTS: Speech paused');
        };
        
        utterance.onresume = () => {
          console.log('▶️ TTS: Speech resumed');
        };
        
        // Fixed: Add boundary event to track speech progress
        utterance.onboundary = (event) => {
          if (event.name === 'sentence') {
            console.log('📝 TTS: Sentence boundary at', event.charIndex);
          }
        };
        
        // Speak the text
        console.log('🗣️ Starting speech synthesis...');
        window.speechSynthesis.speak(utterance);
      };
      
      // Start the speech process
      speakWhenReady();
      
    } catch (error) {
      console.error('❌ TTS Fatal Error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      let apiUrl = `/api/session/${sessionId}`;
      if (user && user.userType === 'phone') {
        apiUrl += `?phoneUserId=${user._id}`;
      }
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Loaded messages from API:', data.messages);
        console.log('📥 Message details:', data.messages?.map((m: any) => ({ 
          id: m._id, 
          role: m.role, 
          text: m.contentText?.slice(0, 30),
          videos: m.videoSuggestions?.length || 0
        })));
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

  // Debug effect to track message changes
  useEffect(() => {
    console.log('🎯 Messages changed! Count:', messages.length);
    console.log('📝 Current messages:', messages.map(m => `${m.role}:${m._id.slice(-8)} - "${m.contentText.slice(0, 30)}"`));
  }, [messages]);

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
    console.log('📤 Temp message added:', tempUserMessage._id);

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
        console.log('✅ API Response:', data);
        
        // The API returns { message: { assistantMessage } } format
        if (data.message) {
          const assistantMessage = {
            _id: data.message._id,
            role: 'assistant' as const,
            contentText: data.message.contentText,
            createdAt: data.message.createdAt,
            videoSuggestions: data.message.videoSuggestions || [],
            isCrisisResponse: data.message.isCrisisResponse,
            crisisType: data.message.crisisType,
            crisisSeverity: data.message.crisisSeverity,
          };
          
          console.log('🎥 Video suggestions received:', data.message.videoSuggestions?.length || 0);
          if (data.message.videoSuggestions?.length > 0) {
            console.log('📹 Video details:', data.message.videoSuggestions.map((v: any) => ({
              title: v.title?.slice(0, 30),
              url: v.url,
              thumbnail: v.thumbnail
            })));
          }
          
          // Update temp user message to be permanent and add assistant response
          setMessages(prev => {
            console.log('🔄 Before update - Message count:', prev.length);
            console.log('🔄 Temp message ID to remove:', tempUserMessage._id);
            const withoutTemp = prev.filter(msg => msg._id !== tempUserMessage._id);
            console.log('➖ After removing temp - Message count:', withoutTemp.length);
            const permanentUserMessage = { 
              ...tempUserMessage, 
              _id: `user-${Date.now()}-${Math.random()}` 
            };
            console.log('➕ Creating permanent user message:', permanentUserMessage._id);
            const newMessages = [...withoutTemp, permanentUserMessage, assistantMessage];
            console.log('💬 Final message count:', newMessages.length);
            console.log('📋 All message IDs:', newMessages.map(m => `${m.role}:${m._id}`));
            return newMessages;
          });
          
          // Auto-speak AI response (always enabled since we removed mode selector)
          if (assistantMessage.contentText) {
            setTimeout(() => {
              console.log('🔊 Attempting to speak AI response:', assistantMessage.contentText.slice(0, 50));
              speakTextImproved(assistantMessage.contentText);
            }, 800);
          }
          
          onMessageSent?.(assistantMessage);
        } else {
          console.error('❌ Unexpected API response format:', data);
          // Remove temp message if API response is invalid
          setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Keep temp message visible but mark it as failed
      setMessages(prev => prev.map(msg => 
        msg._id === tempUserMessage._id 
          ? { ...msg, contentText: `❌ ${msg.contentText} (Failed - Click to retry)`, failed: true } 
          : msg
      ));
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
    if (!supportsSpeech || !recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast('Recording stopped');
    } else {
      // Fixed: Clear previous transcript to prevent repetition
      setNewMessage('');
      accumulatedTranscriptRef.current = '';
      setHasVoiceTranscript(false);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast('Recording started - Speak now');
      } catch (e) {
        console.error('Error starting recognition:', e);
        toast.error('Failed to start recording');
      }
    }
  };

  const cutRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    setNewMessage('');
    accumulatedTranscriptRef.current = '';
    setHasVoiceTranscript(false);
    toast('Recording discarded');
  };

  const stopAndSendRecording = async () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
    const finalText = (newMessage.trim() || accumulatedTranscriptRef.current.trim());
    accumulatedTranscriptRef.current = '';
    setHasVoiceTranscript(false);
    if (!finalText) return;
    setNewMessage(finalText);
    await sendMessage();
  };

  const getTranscriptText = (): string => {
    return messages
      .map(m => `${m.role === 'assistant' ? 'AI' : 'You'}: ${m.contentText}`)
      .join('\n');
  };

  // Fixed: Add manual summary generation function
  const generateSummary = async () => {
    if (messages.length < 4) {
      toast.error('Need at least 4 messages to generate a summary');
      return;
    }

    try {
      setIsSending(true);
      toast('Generating summary...');

      const response = await fetch(`/api/session/${sessionId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(user && user.userType === 'phone' ? { phoneUserId: user._id } : {}),
          language: language
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Summary generated successfully!');
        console.log('Summary generated:', data.summary);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to generate summary: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsSending(false);
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 p-3 max-w-[80%] ml-2">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</span>
        </div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Spacer to ensure messages are visible after header removal */}
      <div className="h-4 bg-gray-50 dark:bg-gray-900"></div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700"></div>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent absolute top-0"></div>
            </div>
            <p className="text-sm mt-3">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Centered input layout for empty chat */
          <div className="flex flex-col items-center justify-center h-full pt-16">
            {/* Greeting Message */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {user?.firstName 
                  ? (language === 'hi' ? `नमस्ते, ${user.firstName}!` : 
                     language === 'mr' ? `नमस्कार, ${user.firstName}!` : 
                     `Hello, ${user.firstName}!`)
                  : (language === 'hi' ? 'नमस्ते!' : 
                     language === 'mr' ? 'नमस्कार!' : 
                     'Hello!')
                }
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
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
            
            <div className="w-full max-w-2xl mx-auto">
              {/* Centered Input Area */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <div className="relative bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
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
                        className="w-full p-3 bg-transparent resize-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                        rows={1}
                        disabled={isSending}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {/* Show controls based on mode */}
                    {mode === 'voice' ? (
                      // Voice mode - show recording controls
                      isRecording ? (
                        <>
                          <button
                            onClick={cutRecording}
                            className="p-3 sm:p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                            title="Cancel recording"
                          >
                            <Scissors className="w-5 h-5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={stopAndSendRecording}
                            className="p-3 sm:p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                            title="Send recording"
                          >
                            <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                          </button>
                        </>
                      ) : hasVoiceTranscript ? (
                        // Show send button when voice transcript is ready
                        <>
                          <button
                            onClick={cutRecording}
                            className="p-3 sm:p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                            title="Cancel recording"
                          >
                            <Scissors className="w-5 h-5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={stopAndSendRecording}
                            className="p-3 sm:p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                            title="Send recording"
                          >
                            <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={toggleRecording}
                          disabled={!supportsSpeech}
                          className="flex items-center space-x-2 px-4 py-3 sm:px-3 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 min-w-[120px] min-h-[44px] sm:min-w-[120px] sm:min-h-[44px]"
                          title="Start voice recording"
                        >
                          <Mic className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-sm">Tap to speak</span>
                        </button>
                      )
                    ) : (
                      // Text mode - show only send button
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                        title="Send message"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Mode and Language indicators */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
                    </span>
                  </div>
                  {/* Fixed: Add summary generation button for empty chat */}
                  <button
                    onClick={generateSummary}
                    disabled={messages.length < 4 || isSending}
                    className="px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-700 dark:text-green-300 rounded text-xs disabled:opacity-50"
                  >
                    Generate Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-14">
            {(() => {
              console.log('🎨 Rendering messages. Total:', messages.length, 'Filtered:', messages.filter(message => message && message.role).length);
              return null;
            })()}
            {messages.filter(message => message && message.role).map((message) => (
              <div
                key={message._id || `msg-${Date.now()}-${Math.random()}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-lg rounded-br-md mr-2'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700 ml-2'
                  } p-3`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.contentText || ''}
                  </p>
                  
                  {/* YouTube Video Suggestions */}
                  {message.videoSuggestions && message.videoSuggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {language === 'hi' ? 'सुझाए गए वीडियो:' : 
                         language === 'mr' ? 'सुचविलेले व्हिडिओ:' : 
                         'Suggested Videos:'}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {message.videoSuggestions.map((video, index) => (
                          <div 
                            key={video.id || index}
                            className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                            onClick={() => window.open(video.url, '_blank')}
                          >
                            {video.thumbnail && (
                              <img 
                                src={video.thumbnail} 
                                alt={video.title}
                                className="w-20 h-15 object-cover rounded flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white overflow-hidden mb-1" 
                                  style={{ 
                                    display: '-webkit-box', 
                                    WebkitLineClamp: 2, 
                                    WebkitBoxOrient: 'vertical' 
                                  }}>
                                {video.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {video.channelTitle}
                              </p>
                              {video.duration && (
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-black text-white rounded">
                                  {video.duration}
                                </span>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Only show when messages exist */}
      {messages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <div className="relative bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
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
                    className="w-full p-3 bg-transparent resize-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
                    rows={1}
                    disabled={isSending}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                {/* Show controls based on mode */}
                {mode === 'voice' ? (
                  // Voice mode - show recording controls
                  isRecording ? (
                    <>
                      <button
                        onClick={cutRecording}
                        className="p-3 sm:p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                        title="Cancel recording"
                      >
                        <Scissors className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={stopAndSendRecording}
                        className="p-3 sm:p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                        title="Send recording"
                      >
                        <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                    </>
                  ) : hasVoiceTranscript ? (
                    // Show send button when voice transcript is ready
                    <>
                      <button
                        onClick={cutRecording}
                        className="p-3 sm:p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                        title="Cancel recording"
                      >
                        <Scissors className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={stopAndSendRecording}
                        className="p-3 sm:p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                        title="Send recording"
                      >
                        <Check className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleRecording}
                      disabled={!supportsSpeech}
                      className="flex items-center space-x-2 px-4 py-3 sm:px-3 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 min-w-[120px] min-h-[44px] sm:min-w-[120px] sm:min-h-[44px]"
                      title="Start voice recording"
                    >
                      <Mic className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-sm">Tap to speak</span>
                    </button>
                  )
                ) : (
                  // Text mode - show only send button
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="p-3 sm:p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                    title="Send message"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5 sm:w-4 sm:h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Status and Actions */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex space-x-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
                </span>
                {/* Debug TTS Button - Always available now */}
                {/* <button
                  onClick={() => speakTextImproved('Testing voice output. Can you hear this?')}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 rounded text-xs"
                >
                  Test Voice
                </button> */}
                {/* Fixed: Add summary generation button */}
                {/* <button
                  onClick={generateSummary}
                  disabled={messages.length < 4 || isSending}
                  className="px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-700 dark:text-green-300 rounded text-xs disabled:opacity-50"
                >
                  Generate Summary
                </button> */}
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
      )}
    </div>
  );
}
