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

  useEffect(() => {
    if (sessionId && phoneUserLoading === false && isPhoneUser) {
      setIsLoading(true);
      fetchSession();
    }
  }, [sessionId, phoneUserLoading, isPhoneUser]);

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

  const speakText = (text: string, messageId?: string) => {
    if (typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = session?.language === 'hi' ? 'hi-IN' : session?.language === 'mr' ? 'mr-IN' : 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      
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
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                AM Avichal Mind
              </div>
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
