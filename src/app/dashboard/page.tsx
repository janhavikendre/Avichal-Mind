'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      syncUser();
      fetchSessions();
    }
  }, [isLoaded, user]);

  const syncUser = async () => {
    try {
      const response = await fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('User sync result:', data);
      } else {
        console.error('Failed to sync user');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/session');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
                     <Link href="/sign-in">
             <Button className="bg-purple-600 hover:bg-purple-700 text-white">Sign In</Button>
           </Link>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Your mental wellness journey continues here. Ready to start a new session?
          </p>
          <div className="mt-6">
            <Link href="/session/new">
              <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg font-bold rounded-2xl">
                Start New Session
              </Button>
            </Link>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <AnimatedCard>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</div>
              </CardContent>
            </Card>
          </AnimatedCard>
          
          <AnimatedCard>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {sessions.filter(s => {
                    const sessionDate = new Date(s.startedAt);
                    const now = new Date();
                    return sessionDate.getMonth() === now.getMonth() && 
                           sessionDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
          
          <AnimatedCard>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {sessions.reduce((total, session) => total + session.messageCount, 0)}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

                {/* Recent Sessions */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Recent Sessions</h2>
            <Link href="/sessions">
              <Button className="bg-gray-600 hover:bg-gray-700 text-white w-full sm:w-auto">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <AnimatedCard>
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="text-center py-8 sm:py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Start your first wellness session to begin your journey.</p>
                  <Link href="/session/new">
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">Start Your First Session</Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedCard>
          ) : (
            <div className="grid gap-4">
              {sessions.slice(0, 5).map((session) => (
                <AnimatedCard key={session._id}>
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <Badge className={session.mode === 'voice' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}>
                              {session.mode === 'voice' ? 'Voice' : 'Text'}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
                            </Badge>
                            {session.safetyFlags.crisis && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Crisis Flagged</Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                            Session on {formatDate(new Date(session.startedAt))}
                          </h3>
                          {session.summary && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">
                              {session.summary}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            <span>{session.messageCount} messages</span>
                            {session.totalDuration && (
                              <span>{Math.floor(session.totalDuration / 60)}m {session.totalDuration % 60}s</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                          <Link href={`/session/${session._id}`}>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-xs sm:text-sm w-full sm:w-auto">View</Button>
                          </Link>
                          {!session.completedAt && (
                            <Link href={`/session/${session._id}/continue`}>
                              <Button className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-xs sm:text-sm w-full sm:w-auto">Continue</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>

                {/* Quick Actions */}
        <AnimatedCard>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Get started with your wellness journey</CardDescription>
            </CardHeader>
            <CardContent>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <Link href="/session/new?mode=text">
                   <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 sm:h-12 text-sm sm:text-base px-4 py-2 rounded-lg">
                     Start Text Session
                   </Button>
                 </Link>
                 <Link href="/session/new?mode=voice">
                   <Button className="bg-green-600 hover:bg-green-700 text-white w-full h-10 sm:h-12 text-sm sm:text-base px-4 py-2 rounded-lg">
                     Start Voice Session
                   </Button>
                 </Link>
               </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  );
}
