'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { AnimatedCard } from '@/components/ui/animated-card';
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
  Heart
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
  const router = useRouter();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements'>('overview');

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }

    fetchGamificationData();
  }, [user, isLoaded]);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification');
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.progress);
        setBadges(data.badges);
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-purple-600';
    if (level >= 5) return 'text-blue-600';
    if (level >= 3) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 7) return 'text-orange-600';
    return 'text-red-600';
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        <FloatingNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <FloatingNavbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Achievement Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your progress and unlock rewards on your wellness journey
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading achievements...</p>
            </div>
          </div>
        ) : userProgress ? (
          <>
            {/* Level and Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Level Card */}
              <AnimatedCard>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-purple-100 text-sm">Current Level</p>
                        <p className={`text-3xl font-bold ${getLevelColor(userProgress.level)}`}>
                          {userProgress.level}
                        </p>
                      </div>
                      <Crown className="h-12 w-12 text-purple-200" />
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress to Level {userProgress.level + 1}</span>
                        <span>{Math.round(userProgress.progressToNext)}%</span>
                      </div>
                      <Progress value={userProgress.progressToNext} className="h-2" />
                    </div>
                    <p className="text-sm text-purple-100">
                      {userProgress.points} / {userProgress.pointsForNext} points
                    </p>
                  </CardContent>
                </Card>
              </AnimatedCard>

              {/* Streak Card */}
              <AnimatedCard>
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-orange-100 text-sm">Current Streak</p>
                        <p className={`text-3xl font-bold ${getStreakColor(userProgress.streak.current)}`}>
                          {userProgress.streak.current} days
                        </p>
                      </div>
                      <Flame className="h-12 w-12 text-orange-200" />
                    </div>
                    <p className="text-sm text-orange-100 mb-2">
                      Longest streak: {userProgress.streak.longest} days
                    </p>
                    <div className="flex items-center text-sm text-orange-100">
                      <Zap className="h-4 w-4 mr-1" />
                      Keep it going!
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>

              {/* Points Card */}
              <AnimatedCard>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-green-100 text-sm">Total Points</p>
                        <p className="text-3xl font-bold text-green-200">
                          {userProgress.points}
                        </p>
                      </div>
                      <Gem className="h-12 w-12 text-green-200" />
                    </div>
                    <p className="text-sm text-green-100 mb-2">
                      Earn points by completing sessions
                    </p>
                    <div className="flex items-center text-sm text-green-100">
                      <Heart className="h-4 w-4 mr-1" />
                      Every session counts!
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <AnimatedCard>
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900 dark:text-white">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                      Badges Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Unlocked</span>
                        <span>{userProgress.completedBadges} / {userProgress.totalBadges}</span>
                      </div>
                      <Progress value={userProgress.badgeProgress} className="h-2" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(userProgress.badgeProgress)}% complete
                    </p>
                  </CardContent>
                </Card>
              </AnimatedCard>

              <AnimatedCard>
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900 dark:text-white">
                      <Target className="h-5 w-5 mr-2 text-blue-500" />
                      Achievements Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completed</span>
                        <span>{userProgress.completedAchievements} / {userProgress.totalAchievements}</span>
                      </div>
                      <Progress value={userProgress.achievementProgress} className="h-2" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(userProgress.achievementProgress)}% complete
                    </p>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    activeTab === 'overview'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Overview
                </Button>
                <Button
                  onClick={() => setActiveTab('badges')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    activeTab === 'badges'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Badges ({userProgress.completedBadges})
                </Button>
                <Button
                  onClick={() => setActiveTab('achievements')}
                  className={`px-4 py-2 text-sm rounded-md ${
                    activeTab === 'achievements'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Achievements ({userProgress.completedAchievements})
                </Button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Recent Badges */}
                <div className="md:col-span-2 lg:col-span-1">
                  <AnimatedCard>
                    <Card className="bg-white dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">Recent Badges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {badges.slice(0, 3).length > 0 ? (
                          <div className="space-y-3">
                            {badges.slice(0, 3).map((badge) => (
                              <div key={badge.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-2xl">{badge.icon}</span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">{badge.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{badge.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No badges unlocked yet. Start your journey!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </div>

                {/* Recent Achievements */}
                <div className="md:col-span-2 lg:col-span-2">
                  <AnimatedCard>
                    <Card className="bg-white dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">Recent Achievements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {achievements.filter(a => a.completed).slice(0, 3).length > 0 ? (
                          <div className="space-y-3">
                            {achievements.filter(a => a.completed).slice(0, 3).map((achievement) => (
                              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex-shrink-0">
                                  {getAchievementIcon(achievement.category)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">{achievement.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Completed
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No achievements completed yet. Keep going!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge) => (
                  <AnimatedCard key={badge.id}>
                    <Card className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{badge.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{badge.description}</p>
                        <div className="flex items-center justify-center space-x-2">
                          {getCategoryIcon(badge.category)}
                          <Badge className="text-xs">
                            {badge.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                ))}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <AnimatedCard key={achievement.id}>
                    <Card className={`bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow ${
                      achievement.completed ? 'ring-2 ring-green-500' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getAchievementIcon(achievement.category)}
                            <h3 className="font-semibold text-gray-900 dark:text-white">{achievement.name}</h3>
                          </div>
                          {achievement.completed && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.target}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.target) * 100} 
                            className="h-2" 
                          />
                        </div>
                        <Badge className="text-xs">
                          {achievement.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start Your Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Complete your first session to unlock achievements and badges!
            </p>
            <Button 
              onClick={() => router.push('/session/new')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Start First Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
