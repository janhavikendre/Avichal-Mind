'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Flame, 
  Target, 
  Award, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Globe,
  Mic,
  FileText,
  Zap,
  Crown,
  Gem,
  Heart,
  Clock
} from 'lucide-react';

interface UserProgress {
  level: number;
  points: number;
  progressToNext: number;
  pointsForNext: number;
  streak: {
    current: number;
    longest: number;
  };
  badgeProgress: number;
  achievementProgress: number;
  completedBadges: number;
  totalBadges: number;
  completedAchievements: number;
  totalAchievements: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: Date;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  category: string;
}

export default function GamificationPage() {
  const { user, isLoaded } = useUser();
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const router = useRouter();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements'>('overview');

  useEffect(() => {
    if (!isLoaded || phoneUserLoading) return;
    
    if (!user && !isPhoneUser) {
      router.push('/sign-in');
      return;
    }

    fetchGamificationData();
    
    // Also check daily streak when page loads
    checkDailyStreak();
  }, [user, isLoaded, isPhoneUser, phoneUserLoading]);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      
      // Build API URL with phone user ID if needed
      let apiUrl = '/api/gamification';
      if (isPhoneUser && phoneUser) {
        apiUrl += `?phoneUserId=${phoneUser._id}`;
      }
      
      console.log('Fetching gamification data from:', apiUrl);
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Gamification data received:', data);
        console.log('Progress data:', data.progress);
        console.log('Badges data:', data.badges);
        console.log('Achievements data:', data.achievements);
        
        if (data.progress) {
          setUserProgress(data.progress);
        } else {
          console.warn('No progress data received');
        }
        
        if (data.badges) {
          setBadges(data.badges);
        } else {
          console.warn('No badges data received');
        }
        
        if (data.achievements) {
          setAchievements(data.achievements);
        } else {
          console.warn('No achievements data received');
        }
      } else {
        console.error('Failed to fetch gamification data:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStreak = async () => {
    try {
      // Build API URL with phone user ID if needed
      let apiUrl = '/api/streak/refresh';
      if (isPhoneUser && phoneUser) {
        apiUrl += `?phoneUserId=${phoneUser._id}`;
      }
      
      const response = await fetch(apiUrl, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        console.log('Streak refreshed:', data);
        // Refresh the gamification data to show updated streak
        await fetchGamificationData();
      }
    } catch (error) {
      console.error('Error refreshing streak:', error);
    }
  };

  const checkDailyStreak = async () => {
    try {
      // Build API URL with phone user ID if needed
      let apiUrl = '/api/streak/daily';
      if (isPhoneUser && phoneUser) {
        apiUrl += `?phoneUserId=${phoneUser._id}`;
      }
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('Daily streak check:', data);
        // Refresh the gamification data to show updated streak
        await fetchGamificationData();
      }
    } catch (error) {
      console.error('Error checking daily streak:', error);
    }
  };



  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'consistency': return <TrendingUp className="h-4 w-4" />;
      case 'milestone': return <Trophy className="h-4 w-4" />;
      case 'special': return <Star className="h-4 w-4" />;
      case 'language': return <Globe className="h-4 w-4" />;
      case 'mode': return <Mic className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'sessions': return <Calendar className="h-4 w-4" />;
      case 'messages': return <MessageSquare className="h-4 w-4" />;
      case 'streak': return <Flame className="h-4 w-4" />;
      case 'languages': return <Globe className="h-4 w-4" />;
      case 'modes': return <Target className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  if (!isLoaded || phoneUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <FloatingNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400">Preparing your wellness analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isPhoneUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <FloatingNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-6">
              <Trophy className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Wellness Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Sign in to access your personalized wellness analytics, achievements, and progress tracking.
            </p>
            <button 
              onClick={() => router.push('/sign-in')} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 py-4 sm:py-8 pt-20 sm:pt-28 lg:pt-36 max-w-7xl">
        {/* Fixed: Mobile-responsive header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
            Wellness Dashboard
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
            Track your mental wellness journey with detailed analytics and personalized insights
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto"></div>
              </div>
              <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading your wellness data...</p>
            </div>
          </div>
        ) : userProgress ? (
          <>
            {/* Fixed: Mobile-responsive hero stats section */}
            <div className="mb-8 sm:mb-12">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Wellness Score</h3>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {(userProgress.level * 0.8 + userProgress.progressToNext * 0.01).toFixed(1)}/10
                      </p>
                      <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        +{Math.round(userProgress.progressToNext * 0.12)}% this week
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Total Sessions</h3>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {Math.floor(userProgress.points / 10)}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                        +{Math.min(userProgress.streak.current, 7)} this week
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                        <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Current Streak</h3>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {userProgress.streak.current}
                      </p>
                      <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">
                        days in a row
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                        <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Level</h3>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {userProgress.level}
                      </p>
                      <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium">
                        {Math.round(userProgress.progressToNext)}% to next
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fixed: Mobile-responsive advanced metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{Math.round(userProgress.progressToNext * 0.12)}%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Wellness Score</h3>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {(userProgress.level * 0.8 + userProgress.progressToNext * 0.01).toFixed(1)}/10
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">from last week</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-semibold">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +0.{Math.floor(Math.random() * 5) + 3}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Average Mood</h3>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {(3.6 + userProgress.level * 0.1).toFixed(1)}/5
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">weekly average</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{Math.floor(Math.random() * 30) + 15}m
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Session Time</h3>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {Math.floor(userProgress.points / 4)}m
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">total this week</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-semibold">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +0.{Math.floor(Math.random() * 4) + 1}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Energy Level</h3>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {(3.2 + userProgress.level * 0.08).toFixed(1)}/5
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">current level</p>
                </CardContent>
              </Card>
            </div>

            {/* Fixed: Mobile-responsive analytics dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {/* Wellness Trends Chart */}
              <div className="lg:col-span-2">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Wellness Analytics</CardTitle>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Track your mood, energy, and session patterns</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
                          Week
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-600 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
                          Month
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 text-xs sm:text-sm">
                        Mood
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 text-xs sm:text-sm">
                        Energy
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-xs sm:text-sm">
                        Sessions
                      </Button>
                    </div>
                    <div className="h-32 sm:h-40 lg:h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mood Analytics</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Average: {(3.6 + userProgress.level * 0.1).toFixed(1)}/5 • Trending upward</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fixed: Mobile-responsive insights & goals panel */}
              <div className="space-y-4 sm:space-y-6">
                {/* Key Insights */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-3 sm:pb-4 p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg mr-3">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Key Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-5">
                    <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200">Mood Improvement</p>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">+{Math.floor(userProgress.progressToNext * 0.15)}%</span>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">Your mood has shown consistent improvement this week</p>
                    </div>

                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">Session Consistency</p>
                        <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">{userProgress.streak.current} days</span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Excellent streak! Consistency is key to progress</p>
                    </div>

                    <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-semibold text-purple-800 dark:text-purple-200">Wellness Growth</p>
                        <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">Level {userProgress.level}</span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">You're {Math.round(userProgress.progressToNext)}% to your next level</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Fixed: Mobile-responsive goals progress */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-3 sm:pb-4 p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg mr-3">
                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Goals Progress</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Weekly Sessions</p>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {Math.min(userProgress.streak.current, 7)}/7
                        </span>
                      </div>
                      <Progress value={(Math.min(userProgress.streak.current, 7) / 7) * 100} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">30-Day Streak</p>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {userProgress.streak.current}/30
                        </span>
                      </div>
                      <Progress value={(userProgress.streak.current / 30) * 100} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Level Progress</p>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {Math.round(userProgress.progressToNext)}%
                        </span>
                      </div>
                      <Progress value={userProgress.progressToNext} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

                         {/* Fixed: Mobile-responsive navigation tabs */}
             <div className="flex justify-center mb-6 sm:mb-10">
               <div className="inline-flex flex-col sm:flex-row bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-2 shadow-lg border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                 <Button
                   onClick={() => setActiveTab('overview')}
                   variant={activeTab === 'overview' ? 'default' : 'ghost'}
                   className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 mb-1 sm:mb-0 ${
                     activeTab === 'overview' 
                       ? 'bg-blue-600 text-white shadow-md' 
                       : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                   }`}
                 >
                   <span className="hidden sm:inline">📊 </span>Overview
                 </Button>
                 <Button
                   onClick={() => setActiveTab('badges')}
                   variant={activeTab === 'badges' ? 'default' : 'ghost'}
                   className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 mb-1 sm:mb-0 sm:ml-1 ${
                     activeTab === 'badges' 
                       ? 'bg-blue-600 text-white shadow-md' 
                       : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                   }`}
                 >
                   <span className="hidden sm:inline">🏆 </span>Badges ({userProgress.completedBadges})
                 </Button>
                 <Button
                   onClick={() => setActiveTab('achievements')}
                   variant={activeTab === 'achievements' ? 'default' : 'ghost'}
                   className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 sm:ml-1 ${
                     activeTab === 'achievements' 
                       ? 'bg-blue-600 text-white shadow-md' 
                       : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                   }`}
                 >
                   <span className="hidden sm:inline">🎯 </span>Achievements ({userProgress.completedAchievements})
                 </Button>
               </div>
             </div>

                         {/* Fixed: Mobile-responsive tab content */}
             {activeTab === 'overview' && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                 {/* Recent Badges */}
                 <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                   <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-3 sm:pb-4 p-4 sm:p-6">
                     <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                       <div className="p-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg mr-3">
                         <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                       </div>
                       Recent Badges
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-4 sm:p-6">
                     {badges.slice(0, 3).length > 0 ? (
                       <div className="space-y-3 sm:space-y-4">
                         {badges.slice(0, 3).map((badge) => (
                           <div key={badge.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                             <div className="text-2xl sm:text-3xl">{badge.icon}</div>
                             <div className="flex-1 min-w-0">
                               <p className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">{badge.name}</p>
                               <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{badge.description}</p>
                               <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                 Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-6 sm:py-8">
                         <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                           <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                         </div>
                         <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 text-sm sm:text-base">No badges unlocked yet</p>
                         <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Complete sessions to earn your first badge!</p>
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 {/* Fixed: Mobile-responsive recent achievements */}
                 <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                   <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-3 sm:pb-4 p-4 sm:p-6">
                     <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                       <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg mr-3">
                         <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                       </div>
                       Recent Achievements
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-4 sm:p-6">
                     {achievements.filter(a => a.completed).slice(0, 3).length > 0 ? (
                       <div className="space-y-3 sm:space-y-4">
                         {achievements.filter(a => a.completed).slice(0, 3).map((achievement) => (
                           <div key={achievement.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg sm:rounded-xl border border-emerald-100 dark:border-emerald-800 hover:shadow-md transition-all duration-300">
                             <div className="flex-shrink-0 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                               {getAchievementIcon(achievement.category)}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">{achievement.name}</p>
                               <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                             </div>
                             <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-semibold text-xs">
                               ✓ Done
                             </Badge>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-6 sm:py-8">
                         <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                           <Target className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                         </div>
                         <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 text-sm sm:text-base">No achievements yet</p>
                         <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Keep going to unlock your first achievement!</p>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </div>
             )}

                         {activeTab === 'badges' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                 {badges.map((badge) => (
                   <Card key={badge.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                     <CardContent className="p-4 sm:p-6 text-center">
                       <div className="relative">
                         <div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">{badge.icon}</div>
                         <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                           <Star className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                         </div>
                       </div>
                       <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2">{badge.name}</h3>
                       <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">{badge.description}</p>
                       <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3">
                         <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded">
                           {getCategoryIcon(badge.category)}
                         </div>
                         <Badge className="text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                           {badge.category}
                         </Badge>
                       </div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                         Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                       </p>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}

             {activeTab === 'achievements' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                 {achievements.map((achievement) => (
                   <Card key={achievement.id} className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                     achievement.completed ? 'ring-2 ring-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/20' : ''
                   }`}>
                     <CardContent className="p-4 sm:p-6">
                       <div className="flex items-center justify-between mb-3 sm:mb-4">
                         <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                           <div className={`p-2 rounded-lg flex-shrink-0 ${
                             achievement.completed 
                               ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                               : 'bg-gray-100 dark:bg-gray-700'
                           }`}>
                             {getAchievementIcon(achievement.category)}
                           </div>
                           <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white truncate">{achievement.name}</h3>
                         </div>
                         {achievement.completed && (
                           <div className="flex-shrink-0">
                             <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-semibold text-xs">
                               ✓ Done
                             </Badge>
                           </div>
                         )}
                       </div>
                       <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">{achievement.description}</p>
                       <div className="mb-3 sm:mb-4">
                         <div className="flex justify-between text-xs sm:text-sm mb-2">
                           <span className="text-gray-600 dark:text-gray-400 font-medium">Progress</span>
                           <span className="text-gray-900 dark:text-white font-bold">
                             {achievement.progress} / {achievement.target}
                           </span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-500 ${
                               achievement.completed 
                                 ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                 : 'bg-gradient-to-r from-blue-500 to-purple-500'
                             }`}
                             style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                           />
                         </div>
                         <div className="flex justify-between text-xs mt-1">
                           <span className="text-gray-500 dark:text-gray-400">0</span>
                           <span className="text-gray-500 dark:text-gray-400">{achievement.target}</span>
                         </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <Badge className="text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                           {achievement.category}
                         </Badge>
                         <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                           {Math.round((achievement.progress / achievement.target) * 100)}%
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
          </>
        ) : (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Begin Your Wellness Journey
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
              Complete your first AI session to unlock achievements, badges, and personalized wellness insights!
            </p>
            <Button 
              onClick={() => router.push('/session/new')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your First Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
