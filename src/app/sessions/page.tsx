'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { useSessions } from '@/hooks/useSessions';
import { Calendar, Clock, MessageSquare, Filter, Search, Trash2, MoreVertical, Eye, Play, Wrench, RefreshCw, Brain } from 'lucide-react';

interface Session {
  _id: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  startedAt: string;
  completedAt?: string;
  messageCount: number;
  summary?: string;
  totalDuration?: number;
  safetyFlags: {
    crisis: boolean;
    pii: boolean;
  };
}

interface Summary {
  _id: string;
  sessionId: string;
  content: string;
  language: 'en' | 'hi' | 'mr';
  version: number;
  generatedAt: string;
  summaryType: 'comprehensive' | 'brief' | 'key_insights';
  metadata: {
    messageCount: number;
    sessionDuration?: number;
    mainTopics: string[];
    emotionalState?: string;
    actionItems?: string[];
  };
  quality: {
    score: number;
    isValid: boolean;
    languageMatches: boolean;
  };
}

export default function AllSessionsPage() {
  const { user, isLoaded } = useUser();
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const router = useRouter();
  const { sessions, loading, error, stats, refreshSessions } = useSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'hi' | 'mr'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'text' | 'voice'>('all');
  const [crisisFilter, setCrisisFilter] = useState<'all' | 'crisis' | 'normal'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debugMode, setDebugMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({});
  const [generatingSummary, setGeneratingSummary] = useState<Record<string, boolean>>({});
  const sessionsPerPage = 10;

  useEffect(() => {
    if (!isLoaded || phoneUserLoading) return;
    
    if (!user && !isPhoneUser) {
      router.push('/sign-in');
      return;
    }
  }, [user, isLoaded, isPhoneUser, phoneUserLoading, router]);

  // Fetch summaries for all sessions
  useEffect(() => {
    if (sessions.length > 0) {
      fetchSummariesForSessions();
    }
  }, [sessions]);

  const fetchSummariesForSessions = async () => {
    try {
      const phoneUserId = isPhoneUser ? phoneUser?._id : undefined;
      const url = phoneUserId 
        ? `/api/summaries?phoneUserId=${phoneUserId}`
        : '/api/summaries';
      
      const response = await fetch(url);
      if (response.ok) {
        const fetchedSummaries: Summary[] = await response.json();
        const summaryMap: Record<string, Summary> = {};
        fetchedSummaries.forEach(summary => {
          summaryMap[summary.sessionId] = summary;
        });
        setSummaries(summaryMap);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const generateSummary = async (sessionId: string) => {
    setGeneratingSummary(prev => ({ ...prev, [sessionId]: true }));
    try {
      const phoneUserId = isPhoneUser ? phoneUser?._id : undefined;
      const url = `/api/summaries/${sessionId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneUserId }),
      });

      if (response.ok) {
        const newSummary: Summary = await response.json();
        setSummaries(prev => ({ ...prev, [sessionId]: newSummary }));
      } else {
        console.error('Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setGeneratingSummary(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const regenerateSummary = async (sessionId: string) => {
    const existingSummary = summaries[sessionId];
    if (!existingSummary) return;

    setGeneratingSummary(prev => ({ ...prev, [sessionId]: true }));
    try {
      const phoneUserId = isPhoneUser ? phoneUser?._id : undefined;
      const response = await fetch(`/api/summaries/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneUserId }),
      });

      if (response.ok) {
        // Remove the old summary
        setSummaries(prev => {
          const newSummaries = { ...prev };
          delete newSummaries[sessionId];
          return newSummaries;
        });
        
        // Generate a new one
        await generateSummary(sessionId);
      }
    } catch (error) {
      console.error('Error regenerating summary:', error);
    } finally {
      setGeneratingSummary(prev => ({ ...prev, [sessionId]: false }));
    }
  };


  const fixSessionSummary = async (sessionId: string) => {
    try {
      const response = await fetch('/api/fix-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Summary fixed:', result);
        // Refresh the sessions list
        refreshSessions();
        alert('Session summary has been fixed!');
      } else {
        console.error('Failed to fix summary');
        alert('Failed to fix session summary. Please try again.');
      }
    } catch (error) {
      console.error('Error fixing summary:', error);
      alert('Error fixing session summary. Please try again.');
    }
  };

  const deleteSession = async (sessionId: string) => {
    // Show confirmation dialog with more detailed warning
    const confirmed = window.confirm(
      '⚠️ WARNING: This action cannot be undone!\n\n' +
      'Deleting this session will permanently remove:\n' +
      '• All conversation messages\n' +
      '• Session summary\n' +
      '• Session metadata\n' +
      '• Associated audio files (if any)\n\n' +
      'Are you absolutely sure you want to delete this session?'
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log(`🗑️ Deleting session ${sessionId}...`);
      const response = await fetch(`/api/session/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Session deleted successfully:', result);
        // Refresh the sessions list
        refreshSessions();
        alert(`✅ Session deleted successfully!\n\nDeleted ${result.deletedMessagesCount} messages.`);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete session:', errorData);
        alert(`❌ Failed to delete session: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      alert('❌ Error deleting session. Please check your connection and try again.');
    }
  };

  const toggleMenu = (sessionId: string) => {
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const handleMenuAction = (sessionId: string, action: string) => {
    setOpenMenuId(null); // Close menu
    
    switch (action) {
      case 'view':
        router.push(`/session/${sessionId}`);
        break;
      case 'continue':
        router.push(`/session/${sessionId}/continue`);
        break;
      case 'fix':
        fixSessionSummary(sessionId);
        break;
      case 'delete':
        deleteSession(sessionId);
        break;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLanguageLabel = (language: string) => {
    switch (language) {
      case 'hi': return 'Hindi';
      case 'mr': return 'Marathi';
      default: return 'English';
    }
  };

  const getModeLabel = (mode: string) => {
    return mode === 'voice' ? 'Voice' : 'Text';
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formatDate(session.startedAt).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || session.language === languageFilter;
    const matchesMode = modeFilter === 'all' || session.mode === modeFilter;
    const matchesCrisis = crisisFilter === 'all' || 
                         (crisisFilter === 'crisis' && session.safetyFlags.crisis) ||
                         (crisisFilter === 'normal' && !session.safetyFlags.crisis);
    
    return matchesSearch && matchesLanguage && matchesMode && matchesCrisis;
  });

  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage
  );

  const totalFilteredPages = Math.ceil(filteredSessions.length / sessionsPerPage);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <FloatingNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isPhoneUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 py-8 pt-28 lg:pt-36">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                All Sessions
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all your mental wellness conversations
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/session/new')}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                ➕ New Session
              </Button>
              <Button 
                onClick={refreshSessions}
                variant="outline"
                className="px-4 py-2 text-sm font-medium rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                🔄 Refresh Sessions
              </Button>
            </div>
          </div>
        </div>

                 {/* Stats */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
             <CardContent className="p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
                 </div>
                 <Calendar className="h-8 w-8 text-blue-600" />
               </div>
             </CardContent>
           </Card>

           <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
             <CardContent className="p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">Text Sessions</p>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">
                     {stats.textSessions}
                   </p>
                 </div>
                 <MessageSquare className="h-8 w-8 text-green-600" />
               </div>
             </CardContent>
           </Card>

           <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
             <CardContent className="p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">Voice Sessions</p>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">
                     {stats.voiceSessions}
                   </p>
                 </div>
                 <Clock className="h-8 w-8 text-purple-600" />
               </div>
             </CardContent>
           </Card>

           <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
             <CardContent className="p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">
                     {stats.totalMessages}
                   </p>
                 </div>
                 <MessageSquare className="h-8 w-8 text-orange-600" />
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Language Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Modes</option>
                <option value="text">Text</option>
                <option value="voice">Voice</option>
              </select>
            </div>

            {/* Crisis Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={crisisFilter}
                onChange={(e) => setCrisisFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sessions</option>
                <option value="crisis">Crisis Flagged</option>
                <option value="normal">Normal Sessions</option>
              </select>
            </div>

            {/* Debug Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setDebugMode(!debugMode)}
                className={`text-sm ${debugMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                {debugMode ? 'Hide All Sessions' : 'Show All Sessions'}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Sessions</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                <button 
                  onClick={refreshSessions}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading sessions...</p>
            </div>
          </div>
        ) : paginatedSessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || languageFilter !== 'all' || modeFilter !== 'all' || crisisFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Start your first session to begin your mental wellness journey.'}
            </p>
            {!searchTerm && languageFilter === 'all' && modeFilter === 'all' && crisisFilter === 'all' && (
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Wellness Journey
              </Button>
            )}
          </div>
        ) : (
                     <div className="space-y-4">
             {paginatedSessions.map((session) => (
               <Card key={session._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                 <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {getModeLabel(session.mode)}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {getLanguageLabel(session.language)}
                          </Badge>
                          {session.completedAt && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </Badge>
                          )}
                          {session.safetyFlags.crisis && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              ⚠️ Crisis Flagged
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Session on {formatDate(session.startedAt)}
                        </p>
                        
                        {session.summary && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                            {session.summary}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {session.messageCount} messages
                          </span>
                          {session.completedAt && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Completed: {formatDate(session.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative menu-container">
                        <Button
                          onClick={() => toggleMenu(session._id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                        
                        {openMenuId === session._id && (
                          <div className="absolute right-0 top-8 z-50 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <div className="py-1">
                              <button
                                onClick={() => handleMenuAction(session._id, 'view')}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <Eye className="mr-3 h-4 w-4" />
                                View Session
                              </button>
                              
                              {!session.completedAt && (
                                <button
                                  onClick={() => handleMenuAction(session._id, 'continue')}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  <Play className="mr-3 h-4 w-4" />
                                  Continue Session
                                </button>
                              )}
                              
                              {session.completedAt && session.summary && (
                                <button
                                  onClick={() => handleMenuAction(session._id, 'fix')}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  <Wrench className="mr-3 h-4 w-4" />
                                  Fix Summary
                                </button>
                              )}
                              
                              <div className="border-t border-gray-200 dark:border-gray-700"></div>
                              
                              <button
                                onClick={() => handleMenuAction(session._id, 'delete')}
                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Delete Session
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        )}

        {/* Pagination */}
        {totalFilteredPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Previous
            </Button>
            
            <span className="text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalFilteredPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalFilteredPages))}
              disabled={currentPage === totalFilteredPages}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
