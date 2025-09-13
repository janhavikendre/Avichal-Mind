'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { RefreshCw, Filter, Calendar, MessageSquare, Brain, Star } from 'lucide-react';

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

interface SummaryStats {
  totalSummaries: number;
  summariesByLanguage: Record<string, number>;
  averageQualityScore: number;
  topicsDistribution: Record<string, number>;
}

export default function SummariesPage() {
  const { user, isLoaded } = useUser();
  const { phoneUser, isPhoneUser, isLoading: phoneUserLoading } = usePhoneUser();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalSummaries: 0,
    summariesByLanguage: {},
    averageQualityScore: 0,
    topicsDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    language?: 'en' | 'hi' | 'mr';
    sortBy: 'generatedAt' | 'version';
    sortOrder: 'asc' | 'desc';
  }>({
    sortBy: 'generatedAt',
    sortOrder: 'desc'
  });

  const fetchSummaries = async () => {
    if (!user && !phoneUser) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder
      });
      
      if (filter.language) {
        params.append('language', filter.language);
      }

      // Add phoneUserId for phone users
      if (phoneUser) {
        params.append('phoneUserId', phoneUser._id);
      }

      console.log('Fetching summaries for user:', user?.id || phoneUser?._id, user?.emailAddresses?.[0]?.emailAddress || phoneUser?.phoneNumber);
      const response = await fetch(`/api/summaries?${params}`);
      
      console.log('Summaries API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Summaries data received:', data);
        setSummaries(data.summaries || []);
        setStats(data.stats || stats);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch summaries:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateSummary = async (sessionId: string) => {
    try {
      const params = new URLSearchParams();
      if (phoneUser) {
        params.append('phoneUserId', phoneUser._id);
      }

      const response = await fetch(`/api/summaries/${sessionId}?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' })
      });

      if (response.ok) {
        await fetchSummaries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error regenerating summary:', error);
    }
  };

  useEffect(() => {
    if ((isLoaded && user) || (phoneUser && !phoneUserLoading)) {
      fetchSummaries();
    }
  }, [isLoaded, user, phoneUser, phoneUserLoading, filter]);

  const getLanguageLabel = (lang: string) => {
    const labels = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };
    return labels[lang as keyof typeof labels] || lang;
  };

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEmotionalStateIcon = (state?: string) => {
    const icons = {
      distressed: '😔',
      anxious: '😰',
      frustrated: '😤',
      hopeful: '😊',
      calm: '😌',
      neutral: '😐'
    };
    return icons[state as keyof typeof icons] || '😐';
  };

  if (!isLoaded || phoneUserLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <FloatingNavbar />
        <div className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !phoneUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <FloatingNavbar />
        <div className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">Please sign in to view your session summaries.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FloatingNavbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Session Summaries</h1>
            <Button onClick={fetchSummaries} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Debug Info
          {(user || phoneUser) && (
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-sm">Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>User ID:</strong> {user?.id || phoneUser?._id}</p>
                  <p><strong>Contact:</strong> {user?.emailAddresses?.[0]?.emailAddress || phoneUser?.phoneNumber}</p>
                  <p><strong>Name:</strong> {user?.firstName || phoneUser?.firstName} {user?.lastName || phoneUser?.lastName}</p>
                  <p><strong>User Type:</strong> {user ? 'Clerk User' : 'Phone User'}</p>
                  <p><strong>Total Summaries Found:</strong> {stats.totalSummaries}</p>
                </div>
              </CardContent>
            </Card>
          )} */}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSummaries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Quality</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageQualityScore.toFixed(1)}/10</div>
                <Progress value={stats.averageQualityScore * 10} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Languages</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.summariesByLanguage).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between text-sm">
                      <span>{getLanguageLabel(lang)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select
                    value={filter.language || ''}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      language: e.target.value ? e.target.value as 'en' | 'hi' | 'mr' : undefined 
                    }))}
                    className="border rounded px-3 py-1"
                  >
                    <option value="">All Languages</option>
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="mr">मराठी</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <select
                    value={filter.sortBy}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      sortBy: e.target.value as 'generatedAt' | 'version' 
                    }))}
                    className="border rounded px-3 py-1"
                  >
                    <option value="generatedAt">Date Generated</option>
                    <option value="version">Version</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <select
                    value={filter.sortOrder}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      sortOrder: e.target.value as 'asc' | 'desc' 
                    }))}
                    className="border rounded px-3 py-1"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summaries List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : summaries.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No summaries yet</h3>
                  <p className="text-gray-600">
                    Complete some sessions to generate summaries. Only meaningful conversations are summarized.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {summaries.map((summary) => (
                <Card key={summary._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(summary.generatedAt).toLocaleDateString()}
                          <Badge variant="outline">
                            {getLanguageLabel(summary.language)}
                          </Badge>
                          <Badge variant="secondary">
                            v{summary.version}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {summary.metadata.messageCount} messages
                          {summary.metadata.sessionDuration && 
                            ` • ${Math.round(summary.metadata.sessionDuration / 60)} minutes`
                          }
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div 
                            className={`w-3 h-3 rounded-full ${getQualityColor(summary.quality.score)}`}
                            title={`Quality Score: ${summary.quality.score}/10`}
                          />
                          <span className="text-sm text-gray-600">{summary.quality.score}/10</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => regenerateSummary(summary.sessionId)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Summary Content */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 leading-relaxed">{summary.content}</p>
                      </div>

                      {/* Metadata */}
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Topics */}
                          {summary.metadata.mainTopics.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Main Topics</h4>
                              <div className="flex flex-wrap gap-1">
                                {summary.metadata.mainTopics.map((topic, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Emotional State */}
                          {summary.metadata.emotionalState && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Emotional State</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {getEmotionalStateIcon(summary.metadata.emotionalState)}
                                </span>
                                <span className="text-sm capitalize">
                                  {summary.metadata.emotionalState}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Items */}
                        {summary.metadata.actionItems && summary.metadata.actionItems.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Actions</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {summary.metadata.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
