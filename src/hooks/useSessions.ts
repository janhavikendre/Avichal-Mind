import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from './usePhoneUser';

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

export function useSessions() {
  const { user, isLoaded } = useUser();
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchSessions = useCallback(async () => {
    // Fixed: Better logic for determining when to fetch data
    const isUserReady = (isLoaded && user) || (isPhoneUser && phoneUser);
    const isStillLoading = (!isLoaded && !phoneUserLoading) || (isLoaded && !user && !isPhoneUser);
    
    if (isStillLoading) {
      console.log('🔍 Skipping session fetch - still loading:', { isLoaded, phoneUserLoading, user: !!user, isPhoneUser });
      return;
    }
    
    if (!isUserReady) {
      console.log('🔍 Skipping session fetch - no authenticated user:', { isLoaded, phoneUserLoading, user: !!user, isPhoneUser });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Build URLs with phoneUserId if it's a phone user
      const sessionUrl = isPhoneUser && phoneUser 
        ? `/api/session?phoneUserId=${phoneUser._id}`
        : '/api/session';
      
      const countUrl = isPhoneUser && phoneUser 
        ? `/api/session/count?phoneUserId=${phoneUser._id}`
        : '/api/session/count';
      
      console.log('🔍 Fetching sessions from:', sessionUrl);
      console.log('🔍 Fetching counts from:', countUrl);
      console.log('🔍 User ready for fetch:', { isPhoneUser, phoneUser: !!phoneUser, clerkUser: !!user });
      
      // Fetch both sessions and counts in parallel
      const [sessionsResponse, countsResponse] = await Promise.all([
        fetch(sessionUrl),
        fetch(countUrl)
      ]);

      console.log('📊 Sessions response status:', sessionsResponse.status);
      console.log('📊 Counts response status:', countsResponse.status);

      if (sessionsResponse.ok && countsResponse.ok) {
        const [sessionsData, countsData] = await Promise.all([
          sessionsResponse.json(),
          countsResponse.json()
        ]);
        
        console.log('📊 Sessions fetched:', sessionsData.sessions?.length || 0, 'sessions');
        console.log('📊 Total sessions from API:', sessionsData.pagination?.total || 'unknown');
        console.log('📊 Session counts:', countsData);
        console.log('📊 Raw sessions data:', sessionsData);
        
        setSessions(sessionsData.sessions || []);
        setRetryCount(0); // Reset retry count on successful fetch
      } else {
        const sessionsError = await sessionsResponse.text();
        const countsError = await countsResponse.text();
        console.error('❌ Failed to fetch sessions:', { sessionsError, countsError });
        setError(`Failed to fetch sessions: ${sessionsResponse.status} - ${sessionsError}`);
        
        // Retry logic for failed requests
        if (retryCount < 3) {
          console.log(`🔄 Retrying session fetch (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchSessions();
          }, 1000 * (retryCount + 1)); // Exponential backoff
        }
      }
    } catch (err) {
      setError('Error fetching sessions');
      console.error('❌ Error fetching sessions:', err);
      
      // Retry logic for network errors
      if (retryCount < 3) {
        console.log(`🔄 Retrying session fetch after error (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchSessions();
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, phoneUserLoading, isPhoneUser, phoneUser, retryCount]);

  const refreshSessions = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Enhanced: Immediate fetch when authentication state changes for both Clerk and phone users
  useEffect(() => {
    const isUserReady = (isLoaded && user) || (isPhoneUser && phoneUser);
    if (isUserReady) {
      console.log('🚀 User authentication confirmed - triggering immediate data fetch', {
        clerkUser: !!user,
        phoneUser: !!phoneUser,
        isLoaded,
        isPhoneUser,
        currentSessions: sessions.length
      });
      
      // Immediate fetch
      fetchSessions();
      
      // Also fetch after a small delay to ensure authentication is fully settled
      const timeoutId = setTimeout(() => {
        console.log('🚀 Delayed fetch to ensure authentication is fully settled');
        fetchSessions();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoaded, user, isPhoneUser, phoneUser, fetchSessions]);

  // Auto-refresh when window gains focus (user returns from session)
  useEffect(() => {
    const handleFocus = () => {
      fetchSessions();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSessions]);

  // Auto-refresh every 30 seconds when page is visible
  useEffect(() => {
    const isUserReady = (isLoaded && user) || (isPhoneUser && phoneUser);
    if (!isUserReady) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSessions();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchSessions, isLoaded, user, phoneUserLoading, isPhoneUser, phoneUser]);

  // Calculate stats
  const stats = {
    totalSessions: sessions.length,
    thisMonthSessions: sessions.filter(s => {
      const sessionDate = new Date(s.startedAt);
      const now = new Date();
      return sessionDate.getMonth() === now.getMonth() && 
             sessionDate.getFullYear() === now.getFullYear();
    }).length,
    totalMessages: sessions.reduce((total, session) => total + session.messageCount, 0),
    textSessions: sessions.filter(s => s.mode === 'text').length,
    voiceSessions: sessions.filter(s => s.mode === 'voice').length,
    completedSessions: sessions.filter(s => s.completedAt).length,
    crisisSessions: sessions.filter(s => s.safetyFlags.crisis).length
  };

  return {
    sessions,
    loading,
    error,
    stats,
    refreshSessions,
    fetchSessions
  };
}
