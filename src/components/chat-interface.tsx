'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Play, Pause, Plus, Scissors, Check } from 'lucide-react';
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
  isSidebarVisible?: boolean; // Add this prop to detect sidebar visibility
}

export default function ChatInterface({ 
  sessionId, 
  mode, 
  language, 
  onMessageSent,
  isContinueSession = false,
  user,
  isSidebarVisible = true // Default to true if not provided
}: ChatInterfaceProps) {
  // Debug logging
  console.log('ChatInterface received user:', user);
  console.log('User type:', user?.userType);
  console.log('User ID:', user?._id);
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

  // Auto-speak AI responses in both text and voice modes
  useEffect(() => {
    if (messages.length > 0) {
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

  // Enhanced Marathi text preprocessing for browser TTS
  function preprocessMarathiTextForBrowser(text: string): string {
    let processedText = text;
    
    // Enhanced Marathi-specific word replacements for better pronunciation and fluency
    const marathiReplacements = {
      // Specific words with pronunciation issues - Enhanced for better fluency
      'झालंय': 'झाले आहे', // Better pronunciation for "झालंय"
      'सांगायचं': 'सांगायचे', // Better pronunciation for "सांगायचं"
      'बोलण्याचा': 'बोलण्याचे', // Better pronunciation for "बोलण्याचा"
      'आज': 'आज', // Ensure proper pronunciation
      'words': 'वर्ड्स', // Convert English "words" to Marathi pronunciation
      'काना': 'काना', // Ensure proper pronunciation
      
      // Enhanced pronunciation for common Marathi words
      'तुम्ही': 'तुम्ही', // You (plural/respectful)
      'तू': 'तू', // You (informal)
      'मी': 'मी', // I
      'आम्ही': 'आम्ही', // We
      'तुमचे': 'तुमचे', // Your
      'माझे': 'माझे', // My
      'आमचे': 'आमचे', // Our
      
      // Enhanced fluency for common phrases
      'कसे आहे': 'कसे आहे', // How are you
      'काय झाले': 'काय झाले', // What happened
      'काय करायचे': 'काय करायचे', // What to do
      'कसे वाटत आहे': 'कसे वाटत आहे', // How are you feeling
      'ठीक आहे': 'ठीक आहे', // It's okay
      'चांगले': 'चांगले', // Good
      'वाईट': 'वाईट', // Bad
    };
    
    // Apply Marathi-specific replacements
    Object.entries(marathiReplacements).forEach(([original, replacement]) => {
      const regex = new RegExp(original, 'g');
      processedText = processedText.replace(regex, replacement);
    });
    
    // Enhanced natural Marathi speech patterns for better fluency
    processedText = processedText.replace(/\. /g, '. '); // Natural pauses
    processedText = processedText.replace(/,/g, ', '); // Comma pauses
    processedText = processedText.replace(/!/g, '! '); // Exclamation pauses
    processedText = processedText.replace(/\?/g, '? '); // Question pauses
    
    // Add natural Marathi speech rhythm and flow
    processedText = processedText.replace(/आहे /g, 'आहे '); // Natural "आहे" flow
    processedText = processedText.replace(/आहात /g, 'आहात '); // Natural "आहात" flow
    processedText = processedText.replace(/आहेत /g, 'आहेत '); // Natural "आहेत" flow
    
    // Enhanced pronunciation for common Marathi verb forms
    processedText = processedText.replace(/करतोय/g, 'करतो आहे'); // Is doing (male form)
    processedText = processedText.replace(/करतेय/g, 'करते आहे'); // Is doing (female form)
    processedText = processedText.replace(/करतातय/g, 'करतात आहेत'); // Are doing (plural)
    
    // Enhanced pronunciation for Marathi question words
    processedText = processedText.replace(/काय/g, 'काय'); // What (clear pronunciation)
    processedText = processedText.replace(/कसे/g, 'कसे'); // How (clear pronunciation)
    processedText = processedText.replace(/कधी/g, 'कधी'); // When (clear pronunciation)
    processedText = processedText.replace(/कुठे/g, 'कुठे'); // Where (clear pronunciation)
    processedText = processedText.replace(/कोण/g, 'कोण'); // Who (clear pronunciation)
    
    // Enhanced pronunciation for Marathi emotional expressions
    processedText = processedText.replace(/दुःख/g, 'दुःख'); // Sadness (clear pronunciation)
    processedText = processedText.replace(/आनंद/g, 'आनंद'); // Joy (clear pronunciation)
    processedText = processedText.replace(/चिंता/g, 'चिंता'); // Worry (clear pronunciation)
    processedText = processedText.replace(/तणाव/g, 'तणाव'); // Stress (clear pronunciation)
    processedText = processedText.replace(/शांत/g, 'शांत'); // Peaceful (clear pronunciation)
    
    // Enhanced pronunciation for Marathi wellness terms
    processedText = processedText.replace(/मानसिक/g, 'मानसिक'); // Mental (clear pronunciation)
    processedText = processedText.replace(/आरोग्य/g, 'आरोग्य'); // Health (clear pronunciation)
    processedText = processedText.replace(/काळजी/g, 'काळजी'); // Care (clear pronunciation)
    processedText = processedText.replace(/समर्थन/g, 'समर्थन'); // Support (clear pronunciation)
    processedText = processedText.replace(/मदत/g, 'मदत'); // Help (clear pronunciation)
    
    return processedText;
  }

  // Enhanced voice configuration for browser TTS
  function getBrowserVoiceConfig(language: 'en' | 'hi' | 'mr', voices: SpeechSynthesisVoice[]): {
    voice: SpeechSynthesisVoice | null;
    rate: number;
    pitch: number;
    reason: string;
  } {
    let targetVoice: SpeechSynthesisVoice | null = null;
    let rate: number;
    let pitch: number;
    let reason: string;

    switch (language) {
      case 'en':
        // English: Priority en-US voices
        rate = 1.0;
        pitch = 1.0;
        
        // Priority 1: en-US voices like "Google US English", "Samantha", "Microsoft Aria"
        targetVoice = voices.find(voice => 
          voice.lang === 'en-US' && (
            voice.name.includes('Google US English') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Microsoft Aria') ||
            voice.name.includes('Google') ||
            voice.name.includes('Microsoft')
          )
        ) || null;
        
        if (targetVoice) {
          reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for English playback - High-quality en-US voice`;
        } else {
          // Fallback to any en-US voice
          targetVoice = voices.find(voice => voice.lang === 'en-US') || null;
          if (targetVoice) {
            reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for English playback - Available en-US voice`;
          } else {
            reason = 'High-quality English voice not available, using browser default';
          }
        }
        break;

      case 'hi':
        // Hindi: hi-IN voices with optimized settings
        rate = 1.05; // Slightly faster for clarity
        pitch = 1.0;
        
        // Priority 1: hi-IN language code
        targetVoice = voices.find(voice => voice.lang === 'hi-IN') || null;
        
        if (targetVoice) {
          reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for Hindi playback - Native Hindi voice`;
        } else {
          // Priority 2: Voices with "Hindi" in the name
          targetVoice = voices.find(voice => voice.name.includes('Hindi')) || null;
          
          if (targetVoice) {
            reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for Hindi playback - Hindi-named voice`;
          } else {
            // Priority 3: Google voices that approximate Hindi
            targetVoice = voices.find(voice => 
              voice.name.includes('Google') && voice.lang.includes('hi')
            ) || null;
            
            if (targetVoice) {
              reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for Hindi playback - Google Hindi approximation`;
            } else {
              reason = 'High-quality Hindi voice not available, using browser default';
            }
          }
        }
        break;

      case 'mr':
        // Marathi: Use same voice configuration as Hindi for better flow and quality
        rate = 1.05; // Same as Hindi - slightly faster for clarity
        pitch = 1.0; // Same as Hindi - natural pitch
        
        // Priority 1: hi-IN language code (same as Hindi)
        targetVoice = voices.find(voice => voice.lang === 'hi-IN') || null;
        
        if (targetVoice) {
          reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for Marathi playback - Using Hindi voice for better flow and quality`;
        } else {
          // Priority 2: Voices with "Hindi" in the name (same as Hindi)
          targetVoice = voices.find(voice => voice.name.includes('Hindi')) || null;
          
          if (targetVoice) {
            reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for Marathi playback - Hindi-named voice for better flow`;
          } else {
            // Priority 3: Google voices that approximate Hindi (same as Hindi)
            targetVoice = voices.find(voice => 
              voice.name.includes('Google') && voice.lang.includes('hi')
            ) || null;
            
            if (targetVoice) {
              reason = `Selected ${targetVoice.name} (${targetVoice.lang}) for Marathi playback - Google Hindi approximation for better flow`;
            } else {
              reason = 'High-quality Marathi voice not available, using browser default';
            }
          }
        }
        break;

      default:
        rate = 1.0;
        pitch = 1.0;
        reason = 'Using default voice configuration';
    }

    return { voice: targetVoice, rate, pitch, reason };
  }

  const speakText = (text: string, messageId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('Speech synthesis not available');
      return;
    }
    
    window.speechSynthesis.cancel();
    
    try {
      // Preprocess Marathi text for better pronunciation
      let processedText = text;
      if (language === 'mr') {
        processedText = preprocessMarathiTextForBrowser(text);
        console.log('Marathi text preprocessed for better pronunciation');
      }
      
      const utterance = new SpeechSynthesisUtterance(processedText);
      const voices = window.speechSynthesis.getVoices();
      
      // Get voice configuration using the new rules
      const voiceConfig = getBrowserVoiceConfig(language, voices);
      
      // Apply voice configuration
      utterance.voice = voiceConfig.voice;
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.volume = 1;
      
      // Log the voice selection with reason
      console.log(voiceConfig.reason);
      
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
      
      console.log('Speaking with:', {
        text: text.substring(0, 50) + '...',
        lang: utterance.lang,
        voice: utterance.voice?.name || 'default',
        rate: utterance.rate,
        pitch: utterance.pitch
      });
      
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
    console.log('Testing TTS with text:', testText);
    console.log('Current language:', language);
    speakText(testText, 'test');
  };

  // Simple TTS test without voice selection
  const testSimpleTTS = () => {
    const testText = language === 'mr' ? 'नमस्कार' : 
                    language === 'hi' ? 'नमस्ते' : 
                    'Hello';
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('Speech synthesis not available');
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => console.log('Simple TTS started');
    utterance.onend = () => console.log('Simple TTS ended');
    utterance.onerror = (event) => console.error('Simple TTS error:', event);
    
    console.log('Testing simple TTS with:', testText, 'lang:', utterance.lang);
    window.speechSynthesis.speak(utterance);
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
        body: JSON.stringify({ 
          language,
          ...(user && user.userType === 'phone' ? { phoneUserId: user._id } : {})
        }),
        keepalive: true
      });
    } catch (_) {
      // best-effort; ignore errors during unload
    }
  };

  const loadMessages = async () => {
    try {
      // Build API URL with phone user ID if needed
      let apiUrl = `/api/session/${sessionId}`;
      if (user && user.userType === 'phone') {
        apiUrl += `?phoneUserId=${user._id}`;
      }
      
      const response = await fetch(apiUrl);
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
      const requestBody = {
        content: userMessage,
        isAudio: false,
        ...(user && user.userType === 'phone' ? { phoneUserId: user._id } : {}),
      };
      
      console.log('Sending message with body:', requestBody);
      console.log('User check:', { user, userType: user?.userType, userId: user?._id });
      
      const response = await fetch(`/api/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  const cutRecording = () => {
    if (mode !== 'voice') return;
    try {
      recognitionRef.current?.stop();
    } catch (_) {
      // ignore
    }
    setIsRecording(false);
    setNewMessage('');
    accumulatedTranscriptRef.current = '';
    toast('Discarded');
  };

  const stopAndSendRecording = async () => {
    if (mode !== 'voice') return;
    try {
      recognitionRef.current?.stop();
    } catch (_) {
      // ignore
    }
    setIsRecording(false);
    const finalText = (newMessage.trim() || accumulatedTranscriptRef.current.trim());
    accumulatedTranscriptRef.current = '';
    if (!finalText) return;
    setNewMessage(finalText);
    await sendMessage();
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

  // Video suggestions component
  const VideoSuggestions = ({ videos, isCrisis, crisisType, language }: { 
    videos: Message['videoSuggestions']; 
    isCrisis?: boolean;
    crisisType?: string;
    language: 'en' | 'hi' | 'mr';
  }) => {
    if (!videos || videos.length === 0) return null;

    // For crisis responses, show crisis video support component
    if (isCrisis && crisisType) {
      const crisisVideos = videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.title, // Use title as description for now
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        url: video.url,
        embedUrl: video.url.replace('watch?v=', 'embed/'),
        duration: video.duration,
        category: video.category as any,
        language: language,
        priority: video.priority as any
      }));

      const emergencyResources = {
        helpline: '988',
        textLine: language === 'hi' ? 'HOME को 741741 पर टेक्स्ट करें' : 
                 language === 'mr' ? 'HOME ला 741741 ला टेक्स्ट करा' : 
                 'Text HOME to 741741',
        emergency: '112'
      };

      const supportMessage = language === 'hi' 
        ? 'ये वीडियो तत्काल सहायता प्रदान करते हैं। कृपया इन्हें देखें और तुरंत समर्थन लें।'
        : language === 'mr'
        ? 'हे व्हिडिओ त्वरित सहाय्य प्रदान करतात. कृपया हे बघा आणि त्वरित समर्थन घ्या.'
        : 'These videos provide immediate support. Please watch them and reach out for immediate help.';

      return (
        <CrisisVideoSupport
          videos={crisisVideos}
          crisisType={crisisType}
          supportMessage={supportMessage}
          emergencyResources={emergencyResources}
          language={language}
        />
      );
    }

    // For regular wellness videos, show simple video list
    return (
      <div className="mt-3 space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'hi' ? 'सहायक वीडियो:' : 
           language === 'mr' ? 'सहाय्यक व्हिडिओ:' : 
           'Helpful Videos:'}
        </h4>
        {videos.map((video) => (
          <div key={video.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-12 h-8 rounded object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/48x32/3b82f6/ffffff?text=Video';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {video.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {video.channelTitle}
              </p>
            </div>
            <button
              onClick={() => window.open(video.url, '_blank', 'noopener,noreferrer')}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              {language === 'hi' ? 'देखें' : 
               language === 'mr' ? 'बघा' : 
               'Watch'}
            </button>
          </div>
        ))}
      </div>
    );
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
          <div className="flex flex-col items-center justify-center h-full">
            {/* <div className="text-center text-gray-600 dark:text-gray-400 px-4 mb-8">
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
            </div> */}
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
                      <VideoSuggestions 
                        videos={message.videoSuggestions} 
                        isCrisis={message.isCrisisResponse}
                        crisisType={message.crisisType}
                        language={language}
                      />
                    )}
                  </div>
                  <div className={`flex items-center justify-between mt-1 sm:mt-2 text-xs ${
                    message.role === 'user' ? 'text-gray-500 dark:text-gray-400 justify-end' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    <span className="text-xs">{new Date(message.createdAt).toLocaleTimeString()}</span>
                    {message.role === 'assistant' && !isContinueSession && mode === 'voice' && (
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
                          <Play size={10} className="sm:w-3 sm:w-3" />
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

      {/* Input Area - Centered when no messages, bottom when messages exist */}
      {messages.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-full mx-auto px-4 pointer-events-auto flex flex-col items-center justify-center transition-all duration-300 ${
            // When sidebar is visible, center in right white area (left margin to account for sidebar)
            // When sidebar is hidden, center in entire white screen
            isSidebarVisible 
              ? 'max-w-md sm:max-w-lg ml-16 sm:ml-20' // Left margin when sidebar visible
              : 'max-w-lg sm:max-w-xl' // Centered in entire white screen when sidebar hidden
          }`}>
            {/* Welcome Text Above Input */}
            <div className="text-center text-gray-600 dark:text-gray-400 px-2 sm:px-4 mb-6 sm:mb-8">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {user?.firstName ? `Hello, ${user.firstName}!` : 'Hello!'}
              </h1>
              <p className="text-xs sm:text-sm">
                {language === 'hi' ? 'अपनी बातचीत यहाँ शुरू करें...' : 
                 language === 'mr' ? 'तुमची संवाद येथे सुरू करा...' : 
                 'Begin your wellness journey'}
              </p>
            </div>
            
            <div className="w-full max-w-md sm:max-w-lg">
              {/* Mobile: Integrated Input Box with Buttons */}
              <div className="sm:hidden">
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    {/* Input Field */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={language === 'hi' ? 'कुछ भी पूछें...' : 
                                   language === 'mr' ? 'काहीही विचारा...' : 
                                   'Ask anything'}
                        className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                        disabled={isRecording}
                      />
                    </div>
                    
                    {/* Voice Button */}
                    <button
                      onClick={toggleRecording}
                      disabled={!supportsSpeech}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                    >
                      <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    {/* Send Button */}
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Recording Controls - Appear below when recording */}
                  {isRecording && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-center space-x-3">
                      <button
                        onClick={cutRecording}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm font-medium"
                        disabled={!isRecording}
                      >
                        <Scissors className="w-4 h-4" />
                        <span>Cut</span>
                      </button>
                      <button
                        onClick={stopAndSendRecording}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm font-medium"
                        disabled={!isRecording}
                      >
                        <Check className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop: Original Layout */}
              <div className="hidden sm:flex items-center space-x-3 w-full">
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
                    className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={1}
                    disabled={isSending}
                    style={{ minHeight: '44px', maxHeight: '200px' }}
                  />
                  {mode !== 'voice' && (
                    <div className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">
                      <Plus size={16} />
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {mode === 'voice' ? (
                    isRecording ? (
                      <>
                        <button
                          onClick={cutRecording}
                          className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          title="Cut"
                        >
                          <Scissors size={18} />
                        </button>
                        <button
                          onClick={stopAndSendRecording}
                          className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                          title="Send"
                        >
                          <Check size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={toggleRecording}
                          className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
                          disabled={!supportsSpeech}
                          title="Start Voice"
                        >
                          <span className="text-sm">tap to speak</span>
                          <Mic size={18} />
                        </button>
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send"
                        >
                          <Send size={18} />
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send"
                      >
                        <Send size={18} />
                      </button>
                    </>
                  )}
                </div>
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
              <div className="flex gap-2">
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
                {/* <button
                  className="text-green-500 hover:text-green-700 transition-colors text-xs px-2 py-1 border border-green-300 rounded"
                  onClick={testSimpleTTS}
                >
                  Test Simple
                </button> */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3">
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
                {mode !== 'voice' && (
                  <div className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-500 dark:text-gray-400">
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                  </div>
                )}
              </div>
              <div className="flex space-x-1 sm:space-x-2">
                {mode === 'voice' ? (
                  isRecording ? (
                    <>
                      <button
                        onClick={cutRecording}
                        className="p-2 sm:p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 touch-button"
                        title="Cut"
                      >
                        <Scissors size={18} className="sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={stopAndSendRecording}
                        className="p-2 sm:p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white touch-button"
                        title="Send"
                      >
                        <Check size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={toggleRecording}
                        className={`p-2 sm:p-3 rounded-lg touch-button flex items-center space-x-2 ${
                          'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                        disabled={!supportsSpeech}
                        title="Start Voice"
                      >
                        <span className="text-sm">tap to speak</span>
                        <Mic size={18} className="sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-2 sm:p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-button"
                        title="Send"
                      >
                        <Send size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )
                ) : (
                  <>
                    {/* <button
                      onClick={testTTS}
                      className="p-2 sm:p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white touch-button"
                      title="Test TTS"
                    >
                      🔊
                    </button> */}
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="p-2 sm:p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-button"
                    >
                      <Send size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}
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
              <div className="flex gap-2">
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
                {/* <button
                  className="text-green-500 hover:text-green-700 transition-colors text-xs px-2 py-1 border border-green-300 rounded"
                  onClick={testSimpleTTS}
                >
                  Test Simple
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
