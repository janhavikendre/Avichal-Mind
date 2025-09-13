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

  // Fixed: Trigger immediate data fetch when user is ready - Enhanced for both user types
  useEffect(() => {
    const isUserReady = (isLoaded && user) || (isPhoneUser && phoneUser);
    if (isUserReady && refreshSessions) {
      console.log('🚀 Dashboard: User authentication confirmed, triggering immediate data fetch', {
        clerkUser: !!user,
        phoneUser: !!phoneUser,
        isLoaded,
        isPhoneUser
      });
      // Trigger immediate data fetch for both Clerk and phone users
      refreshSessions();
    }
  }, [isLoaded, user, isPhoneUser, phoneUser, refreshSessions]);

  // Additional trigger for Clerk user specifically with delayed fetch
  useEffect(() => {
    if (isLoaded && user && refreshSessions) {
      console.log('🚀 Dashboard: Clerk user loaded, ensuring data fetch');
      refreshSessions();
      
      // Also fetch after a small delay to ensure everything is settled
      const timeoutId = setTimeout(() => {
        console.log('🚀 Dashboard: Delayed fetch for Clerk user');
        refreshSessions();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, user, refreshSessions]);

  // Additional trigger for phone user specifically with delayed fetch
  useEffect(() => {
    if (isPhoneUser && phoneUser && refreshSessions) {
      console.log('🚀 Dashboard: Phone user loaded, ensuring data fetch');
      refreshSessions();
      
      // Also fetch after a small delay to ensure everything is settled
      const timeoutId = setTimeout(() => {
        console.log('🚀 Dashboard: Delayed fetch for phone user');
        refreshSessions();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isPhoneUser, phoneUser, refreshSessions]);

  // Additional trigger when page becomes visible (user navigates to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const isUserReady = (isLoaded && user) || (isPhoneUser && phoneUser);
        if (isUserReady && refreshSessions) {
          console.log('🚀 Dashboard: Page became visible, triggering data fetch');
          refreshSessions();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoaded, user, isPhoneUser, phoneUser, refreshSessions]);

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


  // Fixed: Show loading only when both Clerk and phone user are still loading
  const isStillLoading = (!isLoaded && !phoneUserLoading) || (isLoaded && !user && !isPhoneUser);
  
  if (isStillLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400">Preparing your wellness overview...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-6">
            <span className="text-white font-bold text-3xl">A</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome to Avichal Mind
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Please sign in to access your personalized wellness dashboard and continue your mental health journey.
          </p>
          <Link href="/sign-in">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pt-28 lg:pt-36 max-w-7xl">
        {/* Professional Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-blue-700 dark:text-blue-300 rounded-2xl text-sm font-semibold mb-8 shadow-lg border border-blue-100 dark:border-blue-800">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full mr-3 animate-pulse" />
            Welcome back, {isPhoneUser && phoneUser ? phoneUser.firstName : user?.firstName || 'User'}!
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6">
            Wellness Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
            Track your mental wellness journey and continue your path to better mental health with personalized insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/session/new">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-12 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Start New Session
              </Button>
            </Link>
            <Button 
              onClick={refreshSessions}
              variant="outline"
              className="px-8 py-4 text-sm font-semibold rounded-xl border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            >
              🔄 Refresh Stats
            </Button>
          </div>
        </div>

        {/* Clean Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    All time
                  </div>
                </div>
              </div>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalSessions}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">completed sessions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    +{Math.max(0, stats.thisMonthSessions - 3)}
                  </div>
                </div>
              </div>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.thisMonthSessions}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">monthly progress</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Active
                  </div>
                </div>
              </div>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalMessages}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">conversations shared</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-500 text-white border-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-white/90 text-sm font-medium">
                    View
                  </div>
                </div>
              </div>
              <CardTitle className="text-sm font-medium text-white/80 uppercase tracking-wide">
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/gamification">
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-lg py-3 font-medium">
                  🏆 View Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Recent Sessions */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Recent Sessions</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Continue where you left off or review your progress</p>
            </div>
            <Link href="/sessions">
              <Button className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium">
                View All Sessions
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="relative mb-8">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="text-center py-20">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Start Your Wellness Journey</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Begin your first session to start tracking your mental wellness progress and receive personalized support.
                </p>
                <Link href="/session/new">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium">
                    Start Your First Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {sessions.slice(0, 5).map((session) => (
                <Card key={session._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                            {session.mode === 'voice' ? '🎤 Voice' : '💬 Text'}
                          </Badge>
                          <Badge className="bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800">
                            {session.language === 'hi' ? '🇮🇳 Hindi' : session.language === 'mr' ? '🇮🇳 Marathi' : '🇺🇸 English'}
                          </Badge>
                          {session.safetyFlags.crisis && (
                            <Badge className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800">
                              ⚠️ Crisis Flagged
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                          Session on {formatDate(new Date(session.startedAt))}
                        </h3>
                        {session.summary && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
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

        {/* Refined Quick Actions */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Quick Start</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Choose your preferred session type
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/session/new?mode=text">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Text Session</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Type and chat with AI</p>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/session/new?mode=voice">
                <Card className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Voice Session</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Speak with AI naturally</p>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
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
