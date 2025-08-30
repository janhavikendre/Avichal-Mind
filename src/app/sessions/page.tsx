'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Calendar, Clock, MessageSquare, Filter, Search } from 'lucide-react';

interface Session {
  _id: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  createdAt: string;
  messageCount: number;
  summary?: string;
  isCompleted: boolean;
  lastMessageAt?: string;
}

export default function AllSessionsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'hi' | 'mr'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'text' | 'voice'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const sessionsPerPage = 10;

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }

    fetchSessions();
  }, [user, isLoaded, currentPage, languageFilter, modeFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/session');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setTotalPages(Math.ceil((data.sessions?.length || 0) / sessionsPerPage));
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

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
                         formatDate(session.createdAt).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || session.language === languageFilter;
    const matchesMode = modeFilter === 'all' || session.mode === modeFilter;
    
    return matchesSearch && matchesLanguage && matchesMode;
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            All Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your mental wellness conversations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <AnimatedCard>
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Text Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {sessions.filter(s => s.mode === 'text').length}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Voice Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {sessions.filter(s => s.mode === 'voice').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0)}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
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
          </div>
        </div>

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
              {searchTerm || languageFilter !== 'all' || modeFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Start your first session to begin your mental wellness journey.'}
            </p>
            {!searchTerm && languageFilter === 'all' && modeFilter === 'all' && (
              <Button 
                onClick={() => router.push('/session/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start New Session
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedSessions.map((session) => (
              <AnimatedCard key={session._id}>
                <Card className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
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
                          {session.isCompleted && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Session on {formatDate(session.createdAt)}
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
                          {session.lastMessageAt && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Last active: {formatDate(session.lastMessageAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <Button
                          onClick={() => router.push(`/session/${session._id}`)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                        >
                          View
                        </Button>
                        {!session.isCompleted && (
                          <Button
                            onClick={() => router.push(`/session/${session._id}/continue`)}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm"
                          >
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
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
