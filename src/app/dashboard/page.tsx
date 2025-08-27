'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
              <p className="text-gray-600">Your mental wellness journey continues here.</p>
            </div>
            <div className="flex space-x-4">
                             <Link href="/session/new">
                 <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                   Start New Session
                 </Button>
               </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.filter(s => {
                  const sessionDate = new Date(s.startedAt);
                  const now = new Date();
                  return sessionDate.getMonth() === now.getMonth() && 
                         sessionDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.reduce((total, session) => total + session.messageCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
                         <Link href="/sessions">
               <Button className="bg-purple-600 hover:bg-purple-700 text-white">View All</Button>
             </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                <p className="text-gray-600 mb-4">Start your first wellness session to begin your journey.</p>
                                 <Link href="/session/new">
                   <Button className="bg-purple-600 hover:bg-purple-700 text-white">Start Your First Session</Button>
                 </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.slice(0, 5).map((session) => (
                <Card key={session._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                                                     <Badge className={session.mode === 'voice' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                             {session.mode === 'voice' ? 'Voice' : 'Text'}
                           </Badge>
                           <Badge className="bg-purple-100 text-purple-800">
                             {session.language === 'hi' ? 'Hindi' : session.language === 'mr' ? 'Marathi' : 'English'}
                           </Badge>
                           {session.safetyFlags.crisis && (
                             <Badge className="bg-red-100 text-red-800">Crisis Flagged</Badge>
                           )}
                        </div>
                        <h3 className="font-medium text-gray-900">
                          Session on {formatDate(new Date(session.startedAt))}
                        </h3>
                        {session.summary && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {session.summary}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{session.messageCount} messages</span>
                          {session.totalDuration && (
                            <span>{Math.floor(session.totalDuration / 60)}m {session.totalDuration % 60}s</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                                                 <Link href={`/session/${session._id}`}>
                           <Button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-sm">View</Button>
                         </Link>
                         {!session.completedAt && (
                           <Link href={`/session/${session._id}/continue`}>
                             <Button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-sm">Continue</Button>
                           </Link>
                         )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your wellness journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
                             <Link href="/session/new?mode=text">
                 <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-16 text-lg">
                   Start Text Session
                 </Button>
               </Link>
               <Link href="/session/new?mode=voice">
                 <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-16 text-lg">
                   Start Voice Session
                 </Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
