'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
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

  if (!session) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                             <Button
                 onClick={() => router.push('/dashboard')}
                 className="bg-purple-600 hover:bg-purple-700 text-white"
               >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {session.mode === 'voice' ? 'Voice' : 'Text'} Session
                </h1>
                <p className="text-sm text-gray-500">
                  Started {formatDate(new Date(session.startedAt))}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge>
                {session.mode === 'voice' ? 'Voice' : 'Text'}
              </Badge>
                             <Badge>
                 {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
               </Badge>
              {session.safetyFlags.crisis && (
                <Badge>Crisis Flagged</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <ChatInterface
                sessionId={sessionId}
                mode={session.mode}
                language={session.language}
                onMessageSent={handleMessageSent}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
