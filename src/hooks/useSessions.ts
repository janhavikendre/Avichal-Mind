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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalSessions: 0,
    limit: 10
  });
  const [stats, setStats] = useState({
    totalSessions: 0,
    sessionsByMode: { text: 0, voice: 0 },
    sessionsByLanguage: { en: 0, hi: 0, mr: 0 },
    messageStats: { totalMessages: 0, avgMessagesPerSession: 0 }
  });

  const fetchSessions = useCallback(async (page: number = 1) => {
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
        ? `/api/session?phoneUserId=${phoneUser._id}&page=${page}&limit=${pagination.limit}`
        : `/api/session?page=${page}&limit=${pagination.limit}`;
      
      const statsUrl = isPhoneUser && phoneUser 
        ? `/api/session/stats?phoneUserId=${phoneUser._id}`
        : '/api/session/stats';
      
      console.log('🔍 Fetching sessions from:', sessionUrl);
      console.log('🔍 Fetching stats from:', statsUrl);
      console.log('🔍 User ready for fetch:', { isPhoneUser, phoneUser: !!phoneUser, clerkUser: !!user });
      
      // Fetch both sessions and stats in parallel with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const [sessionsResponse, statsResponse] = await Promise.all([
        fetch(sessionUrl, { signal: controller.signal }),
        fetch(statsUrl, { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);

      console.log('📊 Sessions response status:', sessionsResponse.status);
      console.log('📊 Stats response status:', statsResponse.status);

      if (sessionsResponse.ok && statsResponse.ok) {
        const [sessionsData, statsData] = await Promise.all([
          sessionsResponse.json(),
          statsResponse.json()
        ]);
        
        console.log('📊 Sessions fetched:', sessionsData.sessions?.length || 0, 'sessions');
        console.log('📊 Pagination info:', sessionsData.pagination);
        console.log('📊 Session stats:', statsData.stats);
        
        setSessions(sessionsData.sessions || []);
        
        // Update pagination info
        if (sessionsData.pagination) {
          setPagination({
            currentPage: sessionsData.pagination.page || 1,
            totalPages: sessionsData.pagination.pages || 0,
            totalSessions: sessionsData.pagination.total || 0,
            limit: pagination.limit
          });
        }
        
        // Update stats
        if (statsData.stats) {
          setStats(statsData.stats);
        }
        
        setRetryCount(0); // Reset retry count on successful fetch
      } else {
        const sessionsError = await sessionsResponse.text();
        const statsError = await statsResponse.text();
        console.error('❌ Failed to fetch data:', { sessionsError, statsError });
        setError(`Failed to fetch data: ${sessionsResponse.status} - ${sessionsError}`);
        
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
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - please try again');
        console.error('❌ Session fetch timeout');
      } else {
        setError('Error fetching sessions');
        console.error('❌ Error fetching sessions:', err);
      }
      
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

  // Calculate session statistics
  const sessionStats = {
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

  // Add pagination functions
  const loadPage = useCallback((page: number) => {
    fetchSessions(page);
  }, [fetchSessions]);

  const nextPage = useCallback(() => {
    if (pagination.currentPage < pagination.totalPages) {
      loadPage(pagination.currentPage + 1);
    }
  }, [pagination.currentPage, pagination.totalPages, loadPage]);

  const prevPage = useCallback(() => {
    if (pagination.currentPage > 1) {
      loadPage(pagination.currentPage - 1);
    }
  }, [pagination.currentPage, loadPage]);

  const refreshSessions = useCallback(() => {
    setRetryCount(0);
    fetchSessions(pagination.currentPage);
  }, [fetchSessions, pagination.currentPage]);

  return {
    sessions,
    loading,
    error,
    stats, // Use server stats instead of calculated ones
    pagination,
    refreshSessions,
    loadPage,
    nextPage,
    prevPage
  };
}
