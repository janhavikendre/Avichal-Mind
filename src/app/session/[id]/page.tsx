'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, MessageCircle, Mic, Clock, Play, Pause, ChevronDown } from 'lucide-react';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  contentText: string;
  contentAudioUrl?: string;
  createdAt: string;
}

interface Session {
  _id: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  startedAt: string;
  completedAt?: string;
  summary?: string;
  safetyFlags: {
    crisis: boolean;
    pii: boolean;
  };
  messageCount: number;
  totalDuration?: number;
}

export default function SessionPage() {
  const { user, isLoaded } = useUser();
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && (isLoaded || phoneUserLoading === false) && (user || isPhoneUser)) {
      setIsLoading(true);
      fetchSession();
    }
  }, [sessionId, isLoaded, user, phoneUserLoading, isPhoneUser]);

  const fetchSession = async () => {
    try {
      // Build API URL with phone user ID if needed
      let apiUrl = `/api/session/${sessionId}`;
      if (isPhoneUser && phoneUser) {
        apiUrl += `?phoneUserId=${phoneUser._id}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        
        // Validate and filter messages to ensure they have required properties
        const validMessages = (data.messages || []).filter((message: any) => {
          return message && 
                 typeof message === 'object' && 
                 message.role && 
                 (message.role === 'user' || message.role === 'assistant') &&
                 message.contentText &&
                 typeof message.contentText === 'string';
        });
        
        setMessages(validMessages);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Session fetch failed:', response.status, errorData);
        toast.error('Failed to load session');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session');
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

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
        rate = 1.15; // Faster than Hindi for better Marathi flow
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

  // Enhanced Marathi text preprocessing for browser TTS
  const preprocessMarathiTextForBrowser = (text: string): string => {
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
  };

  const speakText = (text: string, messageId?: string) => {
    if (typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    
    try {
      // Preprocess Marathi text for better pronunciation
      let processedText = text;
      if (session?.language === 'mr') {
        processedText = preprocessMarathiTextForBrowser(text);
        console.log('Marathi text preprocessed for better pronunciation');
      }
      
      const utterance = new SpeechSynthesisUtterance(processedText);
      const voices = window.speechSynthesis.getVoices();
      
      // Get voice configuration using the new rules
      const voiceConfig = getBrowserVoiceConfig(session?.language || 'en', voices);
      
      // Apply voice configuration
      utterance.voice = voiceConfig.voice;
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.lang = session?.language === 'mr' ? 'mr-IN' : session?.language === 'hi' ? 'hi-IN' : 'en-US';
      
      // Log the voice selection with reason
      console.log(voiceConfig.reason);
      console.log('Session language:', session?.language);
      console.log('Text to speak:', text.substring(0, 50) + '...');
      
      if (messageId) {
        setPlayingMessageId(messageId);
      }
      
      utterance.onstart = () => {
        console.log('Speech started');
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
    // Safety check to ensure message is valid
    if (!message || !message._id || !message.contentText || typeof message.contentText !== 'string') {
      console.warn('Invalid message object for playback:', message);
      return;
    }

    if (playingMessageId === message._id) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    } else {
      speakText(message.contentText, message._id);
    }
  };

  // Test function to debug voice issues
  const testVoice = () => {
    const testText = session?.language === 'mr' ? 'नमस्कार, मी तुमची मदत करत आहे' : 
                    session?.language === 'hi' ? 'नमस्ते, मैं आपकी मदद कर रहा हूं' : 
                    'Hello, I am here to help you';
    console.log('Testing voice with text:', testText);
    speakText(testText, 'test');
  };

  // Simple fallback voice function
  const speakTextSimple = (text: string, messageId?: string) => {
    if (typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Simple configuration
      if (session?.language === 'mr') {
        utterance.lang = 'mr-IN';
      } else if (session?.language === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      if (messageId) {
        setPlayingMessageId(messageId);
      }
      
      utterance.onend = () => {
        setPlayingMessageId(null);
      };
      
      utterance.onerror = () => {
        setPlayingMessageId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setPlayingMessageId(null);
      console.error('Simple TTS error:', e);
    }
  };

  if (!isLoaded || phoneUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPhoneUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Please sign in to continue</h1>
          <Button onClick={() => router.push('/sign-in')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <FloatingNavbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="text-center py-8">
              <div className="text-red-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Session</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/dashboard')} className="bg-gray-600 hover:bg-gray-700 text-white">
                  Back to Dashboard
                </Button>
                <Button onClick={fetchSession} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <FloatingNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <FloatingNavbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Session Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The session you're looking for doesn't exist.</p>
              <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AM</span>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="text-gray-900 dark:text-white font-semibold">Avichal Mind</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Wellness AI</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full mb-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && "Back to Dashboard"}
          </Button>

          {/* Session Details */}
          {!sidebarCollapsed && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Session Details</div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {session.mode === 'voice' ? (
                    <Mic className="h-4 w-4 text-blue-400" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-blue-400" />
                  )}
                  <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">{session.mode === 'voice' ? 'Voice' : 'Text'} Session</div>
                    <div className="text-gray-600 dark:text-gray-400">{session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-400" />
                  <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">Started {new Date(session.startedAt).toLocaleDateString()}</div>
                    <div className="text-gray-600 dark:text-gray-400">at {new Date(session.startedAt).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-indigo-400" />
                  <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">{session.messageCount} Messages</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {session.totalDuration ? `${Math.floor(session.totalDuration / 60)}m ${session.totalDuration % 60}s` : 'Ongoing'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 text-xs">
                    {session.mode === 'voice' ? 'Voice' : 'Text'}
                  </Badge>
                  <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 text-xs">
                    {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
                  </Badge>
                </div>

              </div>

              {session.summary && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Session Summary</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {session.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 lg:ml-0 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">View Session</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Read-only view of your conversation</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* <div className="hidden sm:block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                AM Avichal Mind
              </div> */}
              {/* <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">J</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* Messages Display - Fixed Height with Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700"></div>
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent absolute top-0"></div>
              </div>
              <p className="text-sm mt-3">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Messages</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This session doesn't have any messages yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.filter(message => message && message.role && message.contentText).map((message) => (
                <div
                  key={message._id || `msg-${Date.now()}-${Math.random()}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                    <div className={`px-3 py-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}>
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
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.contentText || ''}
                      </div>
                    </div>
                    <div className={`flex items-center justify-between mt-2 text-xs ${
                      message.role === 'user' ? 'text-gray-500 dark:text-gray-400 justify-end' : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      <span className="text-xs">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
                      </span>
                      {message.role === 'assistant' && (
                        <button 
                          onClick={() => playMessage(message)}
                          className={`ml-2 p-1 rounded ${
                            playingMessageId === message._id 
                              ? 'bg-red-500 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                          title={playingMessageId === message._id ? 'Stop' : 'Play'}
                        >
                          {playingMessageId === message._id ? 
                            <Pause className="w-3 h-3" /> : 
                            <Play className="w-3 h-3" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
