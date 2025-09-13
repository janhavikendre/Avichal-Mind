'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { toast } from 'react-hot-toast';
import { Phone, Mic, Clock, MessageCircle, ArrowLeft, Play, Pause } from 'lucide-react';

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
  callSid?: string;
  phoneNumber?: string;
}

export default function VoiceSessionPage() {
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    if (sessionId && phoneUserLoading === false && isPhoneUser) {
      setIsLoading(true);
      fetchSession();
    }
  }, [sessionId, phoneUserLoading, isPhoneUser]);

  // Load voices for better TTS
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        } else {
          // Voices might not be loaded yet, try again
          setTimeout(loadVoices, 100);
        }
      }
    };

    loadVoices();
    
    // Also listen for voices changed event
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  const fetchSession = async () => {
    try {
      // Build API URL with phone user ID
      let apiUrl = `/api/session/${sessionId}`;
      if (isPhoneUser && phoneUser) {
        apiUrl += `?phoneUserId=${phoneUser._id}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setMessages(data.messages || []);
      } else {
        toast.error('Failed to load session');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session');
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
        
        return processedText;
      };
      
      // Preprocess Marathi text for better pronunciation
      let processedText = text;
      if (session?.language === 'mr') {
        processedText = preprocessMarathiTextForBrowser(text);
        console.log('Marathi text preprocessed for better pronunciation');
      }
      
      // Apply TTS preprocessing to prevent sentence cutting
      processedText = preprocessTextForTTS(processedText);
      
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
      
      if (messageId) {
        setPlayingMessageId(messageId);
      }
      
      // Fixed: Add better event handling to prevent cutting
      utterance.onend = () => {
        setPlayingMessageId(null);
      };
      
      utterance.onerror = () => {
        setPlayingMessageId(null);
      };
      
      // Fixed: Add boundary event to track speech progress
      utterance.onboundary = (event) => {
        if (event.name === 'sentence') {
          console.log('📝 TTS: Sentence boundary at', event.charIndex);
        }
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

  if (phoneUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPhoneUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">This page is only accessible to phone users.</p>
          <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
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
                <Button onClick={() => router.push('/')} className="bg-gray-600 hover:bg-gray-700 text-white">
                  Go Home
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading voice session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Session Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The voice session you're looking for doesn't exist.</p>
              <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Voice Session</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your AI wellness call</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                AM Avichal Mind
              </div> */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mic className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Voice Session</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Started {new Date(session.startedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        at {new Date(session.startedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-indigo-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{session.messageCount} Messages</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {session.totalDuration ? `${Math.floor(session.totalDuration / 60)}m ${session.totalDuration % 60}s` : 'Ongoing'}
                      </div>
                    </div>
                  </div>

                  {session.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-purple-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Phone Number</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{session.phoneNumber}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700 text-xs">
                      Voice
                    </Badge>
                    <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700 text-xs">
                      {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
                    </Badge>
                  </div>
                </div>

                {session.summary && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Summary</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation</h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                      <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Messages Yet</h3>
                      <p className="text-sm">Your voice conversation will appear here once you start talking.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`px-4 py-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <div className="text-sm leading-relaxed">
                              {message.contentText}
                            </div>
                          </div>
                          <div className={`flex items-center justify-between mt-2 text-xs ${
                            message.role === 'user' ? 'text-gray-500 dark:text-gray-400 justify-end' : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                            {message.role === 'assistant' && (
                              <button 
                                onClick={() => playMessage(message)}
                                className={`ml-2 p-1 rounded ${
                                  playingMessageId === message._id 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                                title={playingMessageId === message._id ? 'Stop' : 'Play'}
                              >
                                {playingMessageId === message._id ? 
                                  <Pause size={12} /> : 
                                  <Play size={12} />
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
