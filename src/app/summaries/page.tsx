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

  // Fixed: Add bulk summary generation function
  const generateMissingSummaries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/generate-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(phoneUser ? { phoneUserId: phoneUser._id } : {})
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bulk summary generation result:', data);
        await fetchSummaries(); // Refresh the list
        alert(`Generated ${data.stats.successful} summaries, skipped ${data.stats.skipped}, failed ${data.stats.failed}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to generate summaries:', errorData);
        alert(`Failed to generate summaries: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error generating summaries:', error);
      alert('Failed to generate summaries');
    } finally {
      setLoading(false);
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
        <div className="container mx-auto px-4 py-4 sm:py-8">
          {/* Fixed: Mobile-responsive header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Session Summaries</h1>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                onClick={generateMissingSummaries} 
                disabled={loading} 
                variant="outline"
                className="w-full sm:w-auto"
                size="sm"
              >
                <Brain className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Generate Missing</span>
                <span className="sm:hidden">Generate</span>
              </Button>
              <Button 
                onClick={fetchSummaries} 
                disabled={loading}
                className="w-full sm:w-auto"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

        

          {/* Fixed: Mobile-responsive statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Summaries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.totalSummaries}</div>
              </CardContent>
            </Card>

            <Card className="p-4 sm:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Average Quality</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.averageQualityScore.toFixed(1)}/10</div>
                <Progress value={stats.averageQualityScore * 10} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <CardTitle className="text-xs sm:text-sm font-medium">Languages</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-1">
                  {Object.entries(stats.summariesByLanguage).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between text-xs sm:text-sm">
                      <span>{getLanguageLabel(lang)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fixed: Mobile-responsive filters */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Language</label>
                  <select
                    value={filter.language || ''}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      language: e.target.value ? e.target.value as 'en' | 'hi' | 'mr' : undefined 
                    }))}
                    className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                  >
                    <option value="">All Languages</option>
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="mr">मराठी</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Sort By</label>
                  <select
                    value={filter.sortBy}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      sortBy: e.target.value as 'generatedAt' | 'version' 
                    }))}
                    className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                  >
                    <option value="generatedAt">Date Generated</option>
                    <option value="version">Version</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Order</label>
                  <select
                    value={filter.sortOrder}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      sortOrder: e.target.value as 'asc' | 'desc' 
                    }))}
                    className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
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
              <CardContent className="pt-6 px-4 sm:px-6">
                <div className="text-center">
                  <Brain className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No summaries yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Complete some sessions to generate summaries. Only meaningful conversations are summarized.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {summaries.map((summary) => (
                <Card key={summary._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    {/* Fixed: Mobile-responsive header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">
                              {new Date(summary.generatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {getLanguageLabel(summary.language)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              v{summary.version}
                            </Badge>
                          </div>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          {summary.metadata.messageCount} messages
                          {summary.metadata.sessionDuration && 
                            ` • ${Math.round(summary.metadata.sessionDuration / 60)} minutes`
                          }
                        </CardDescription>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <div className="flex items-center gap-1">
                          <div 
                            className={`w-3 h-3 rounded-full ${getQualityColor(summary.quality.score)}`}
                            title={`Quality Score: ${summary.quality.score}/10`}
                          />
                          <span className="text-xs sm:text-sm text-gray-600">{summary.quality.score}/10</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => regenerateSummary(summary.sessionId)}
                          className="text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Regenerate</span>
                          <span className="sm:hidden">Regen</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      {/* Fixed: Mobile-responsive summary content */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{summary.content}</p>
                      </div>

                      {/* Fixed: Mobile-responsive metadata */}
                      <div className="border-t pt-3 sm:pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {/* Topics */}
                          {summary.metadata.mainTopics.length > 0 && (
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Main Topics</h4>
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
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Emotional State</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg">
                                  {getEmotionalStateIcon(summary.metadata.emotionalState)}
                                </span>
                                <span className="text-xs sm:text-sm capitalize">
                                  {summary.metadata.emotionalState}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Fixed: Mobile-responsive action items */}
                        {summary.metadata.actionItems && summary.metadata.actionItems.length > 0 && (
                          <div className="mt-3 sm:mt-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Suggested Actions</h4>
                            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                              {summary.metadata.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1 text-xs">•</span>
                                  <span className="leading-relaxed">{item}</span>
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
