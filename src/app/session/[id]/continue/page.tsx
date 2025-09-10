'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import ChatInterface from '@/components/chat-interface';
import { ArrowLeft, MessageCircle, Mic, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Session {
  _id: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  startedAt: string;
  completedAt?: string;
  summary?: string;
  messageCount: number;
  totalDuration?: number;
  safetyFlags: {
    crisis: boolean;
    pii: boolean;
  };
}

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  contentText: string;
  contentAudioUrl?: string;
  createdAt: string;
}

export default function ContinueSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sessionId = params.id as string;

  useEffect(() => {
    if ((isLoaded || phoneUserLoading === false) && (user || isPhoneUser)) {
      loadSession();
    }
  }, [isLoaded, user, phoneUserLoading, isPhoneUser, sessionId]);

  // Cleanup effect to stop speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech synthesis when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build API URL with phone user ID if needed
      let apiUrl = `/api/session/${sessionId}`;
      if (isPhoneUser && phoneUser) {
        apiUrl += `?phoneUserId=${phoneUser._id}`;
      }

      // Load session details
      const sessionResponse = await fetch(apiUrl);
      if (!sessionResponse.ok) {
        throw new Error('Session not found');
      }
      const sessionData = await sessionResponse.json();
      setSession(sessionData.session);
      setMessages(sessionData.messages || []);

      // Check if session is already completed
      if (sessionData.session.completedAt) {
        toast.error('This session has already been completed. You can only view it.');
        router.push(`/session/${sessionId}`);
        return;
      }

    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      toast.error('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSent = (message: Message) => {
    setMessages(prev => [...prev, message]);
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
                <Button onClick={loadSession} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Summary</div>
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
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Continue Session</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Resume your conversation where you left off</p>
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

        {/* Chat Interface - Full Page with Fixed Height */}
        <div className="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
          <ChatInterface
            sessionId={sessionId}
            mode={session.mode}
            language={session.language}
            onMessageSent={handleMessageSent}
            isContinueSession={true}
            user={phoneUser || user}
            isSidebarVisible={sidebarOpen}
          />
        </div>
      </div>
    </div>
  );
}
