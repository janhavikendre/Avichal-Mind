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
import { useSessions } from '@/hooks/useSessions';
import { usePhoneUser } from '@/hooks/usePhoneUser';
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
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const { sessions, loading, stats, refreshSessions } = useSessions();

  useEffect(() => {
    if (isLoaded && user) {
      syncUser();
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


  // Show loading if either Clerk or phone user is still loading
  if (!isLoaded || phoneUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Prioritize phone user - if phone user exists, use them regardless of Clerk status
  if (isPhoneUser && phoneUser) {
    console.log('🎯 Dashboard: Using phone user:', phoneUser.firstName);
    // Continue to render dashboard with phone user
  } else if (!user && !isPhoneUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Avichal Mind</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access your personalized wellness dashboard.</p>
          <Link href="/sign-in">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pt-28">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            Welcome back, {isPhoneUser && phoneUser ? phoneUser.firstName : user?.firstName || 'User'}!
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Your Wellness Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Track your mental wellness journey and continue your path to better mental health
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/session/new">
              <Button className="bg-blue-600 hover:bg-blue-700 px-10 py-4 text-lg font-bold rounded-full">
                Start New Session
              </Button>
            </Link>
            <Button 
              onClick={refreshSessions}
              variant="outline"
              className="px-6 py-3 text-sm font-medium rounded-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              🔄 Refresh Stats
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">All time sessions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.thisMonthSessions}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sessions this month</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMessages}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Conversations shared</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 text-white border-blue-600 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/gamification">
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-lg">
                  🏆 View Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recent Sessions</h2>
              <p className="text-gray-600 dark:text-gray-400">Continue where you left off or start fresh</p>
            </div>
            <Link href="/sessions">
              <Button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full">
                View All Sessions
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Start Your Wellness Journey</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Begin your first session to start tracking your mental wellness progress and receive personalized support.
                </p>
                <Link href="/session/new">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold">
                    Start Your First Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {sessions.slice(0, 5).map((session) => (
                <Card key={session._id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                            {session.mode === 'voice' ? '🎤 Voice' : '💬 Text'}
                          </Badge>
                          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800">
                            {session.language === 'hi' ? '🇮🇳 Hindi' : session.language === 'mr' ? '🇮🇳 Marathi' : '🇺🇸 English'}
                          </Badge>
                          {session.safetyFlags.crisis && (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800">
                              ⚠️ Crisis Flagged
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                          Session on {formatDate(new Date(session.startedAt))}
                        </h3>
                        {session.summary && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                            {session.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {session.messageCount} messages
                          </span>
                          {session.totalDuration && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {Math.floor(session.totalDuration / 60)}m {session.totalDuration % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link href={`/session/${session._id}`}>
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">
                            View Details
                          </Button>
                        </Link>
                        {!session.completedAt && (
                          <Link href={`/session/${session._id}/continue`}>
                            <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium">
                              Continue
                            </Button>
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
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
              Choose your preferred way to start a wellness session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/session/new?mode=text">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Text Session</h3>
                        <p className="text-gray-600 dark:text-gray-400">Chat through text messages</p>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
                      Start Text Chat
                    </Button>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/session/new?mode=voice">
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:shadow-md transition-shadow duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Voice Session</h3>
                        <p className="text-gray-600 dark:text-gray-400">Speak naturally with AI</p>
                      </div>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
                      Start Voice Chat
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
