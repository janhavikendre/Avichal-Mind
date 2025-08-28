'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import ChatInterface from '@/components/chat-interface';

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
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      setIsLoading(true);
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        toast.error('Failed to load session');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSent = (message: Message) => {
    // Refresh session data after message is sent
    fetchSession();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
                     <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => router.push('/dashboard')}>
             Back to Dashboard
           </Button>
        </div>
      </div>
    );
  }

  // Extra safety for TypeScript narrowing
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pt-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {session.mode === 'voice' ? 'Voice' : 'Text'} Session
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Started {formatDate(new Date(session.startedAt))}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {session.mode === 'voice' ? 'Voice' : 'Text'}
              </Badge>
              <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
              </Badge>
              {session.safetyFlags.crisis && (
                <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Crisis Flagged</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <AnimatedCard>
            <Card className="h-[500px] sm:h-[600px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-0 h-full">
                <ChatInterface
                  sessionId={sessionId}
                  mode={session.mode}
                  language={session.language}
                  onMessageSent={handleMessageSent}
                />
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
