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

  const fetchSessions = useCallback(async () => {
    // Don't fetch if still loading or no user is authenticated
    if ((!isLoaded && !phoneUserLoading) || (!user && !isPhoneUser)) {
      console.log('🔍 Skipping session fetch - user not ready:', { isLoaded, phoneUserLoading, user: !!user, isPhoneUser });
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
      } else {
        const sessionsError = await sessionsResponse.text();
        const countsError = await countsResponse.text();
        console.error('❌ Failed to fetch sessions:', { sessionsError, countsError });
        setError(`Failed to fetch sessions: ${sessionsResponse.status} - ${sessionsError}`);
      }
    } catch (err) {
      setError('Error fetching sessions');
      console.error('❌ Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, phoneUserLoading, isPhoneUser, phoneUser]);

  const refreshSessions = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
    if ((!isLoaded && !phoneUserLoading) || (!user && !isPhoneUser)) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSessions();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchSessions, isLoaded, user, phoneUserLoading, isPhoneUser]);

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
