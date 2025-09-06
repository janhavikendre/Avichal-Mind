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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <FloatingNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading your achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isPhoneUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <FloatingNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Please sign in to view achievements</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to access your gamification progress and achievements.</p>
            <button 
              onClick={() => router.push('/sign-in')} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
               <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Current Level</p>
                       <p className="text-3xl font-bold text-gray-900 dark:text-white">
                         {userProgress.level}
                       </p>
                     </div>
                       <Crown className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                   </div>
                   <div className="mb-3">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600 dark:text-gray-400">Progress to Level {userProgress.level + 1}</span>
                       <span className="text-gray-900 dark:text-white font-medium">{Math.round(userProgress.progressToNext)}%</span>
                     </div>
                     <Progress value={userProgress.progressToNext} className="h-2" />
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                     {userProgress.points} / {userProgress.pointsForNext} points
                   </p>
                 </CardContent>
               </Card>

                             {/* Streak Card */}
               <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Current Streak</p>
                       <p className="text-3xl font-bold text-gray-900 dark:text-white">
                         {userProgress.streak.current} days
                       </p>
                     </div>
                       <Flame className="h-10 w-10 text-orange-500" />
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                     Longest streak: {userProgress.streak.longest} days
                   </p>
                   <div className="space-y-2 mb-4">
                     <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                       <Calendar className="h-3 w-3 mr-1" />
                       Next milestone: {userProgress.streak.current >= 7 ? (userProgress.streak.current >= 30 ? '100 days' : '30 days') : '7 days'}
                     </div>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                       <div 
                         className="bg-orange-500 h-1.5 rounded-full"
                         style={{ 
                           width: `${Math.min((userProgress.streak.current / (userProgress.streak.current >= 7 ? (userProgress.streak.current >= 30 ? 100 : 30) : 7)) * 100, 100)}%` 
                         }}
                       ></div>
                     </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                       <Zap className="h-4 w-4 mr-1 text-orange-500" />
                       Keep it going!
                     </div>
                     <div className="flex gap-2">
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="text-xs px-2 py-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                         onClick={checkDailyStreak}
                       >
                         Daily Check
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="text-xs px-2 py-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                         onClick={refreshStreak}
                       >
                         Refresh
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>

                             {/* Points Card */}
               <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Points</p>
                       <p className="text-3xl font-bold text-gray-900 dark:text-white">
                         {userProgress.points}
                       </p>
                     </div>
                       <Gem className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                     Earn points by completing sessions
                   </p>
                   <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                     <Heart className="h-4 w-4 mr-1 text-gray-400" />
                     Every session counts!
                   </div>
                 </CardContent>
               </Card>
            </div>

                         {/* Progress Stats */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                 <CardHeader>
                   <CardTitle className="flex items-center text-gray-900 dark:text-white">
                     <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                     Badges Progress
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="mb-4">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600 dark:text-gray-400">Unlocked</span>
                       <span className="text-gray-900 dark:text-white font-medium">{userProgress.completedBadges} / {userProgress.totalBadges}</span>
                     </div>
                     <Progress value={userProgress.badgeProgress} className="h-2" />
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                     {Math.round(userProgress.badgeProgress)}% complete
                   </p>
                 </CardContent>
               </Card>

               <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                 <CardHeader>
                   <CardTitle className="flex items-center text-gray-900 dark:text-white">
                     <Target className="h-5 w-5 mr-2 text-blue-500" />
                     Achievements Progress
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="mb-4">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600 dark:text-gray-400">Completed</span>
                       <span className="text-gray-900 dark:text-white font-medium">{userProgress.completedAchievements} / {userProgress.totalAchievements}</span>
                       </div>
                     <Progress value={userProgress.achievementProgress} className="h-2" />
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                     {Math.round(userProgress.achievementProgress)}% complete
                   </p>
                 </CardContent>
               </Card>
             </div>

                         {/* Tabs */}
             <div className="flex justify-center mb-6">
               <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                 <Button
                   onClick={() => setActiveTab('overview')}
                   variant={activeTab === 'overview' ? 'default' : 'ghost'}
                   className="px-4 py-2 text-sm"
                 >
                   Overview
                 </Button>
                 <Button
                   onClick={() => setActiveTab('badges')}
                   variant={activeTab === 'badges' ? 'default' : 'ghost'}
                   className="px-4 py-2 text-sm"
                 >
                   Badges ({userProgress.completedBadges})
                 </Button>
                 <Button
                   onClick={() => setActiveTab('achievements')}
                   variant={activeTab === 'achievements' ? 'default' : 'ghost'}
                   className="px-4 py-2 text-sm"
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
                   <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
                 </div>

                 {/* Recent Achievements */}
                 <div className="md:col-span-2 lg:col-span-2">
                   <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
                   </div>
                 </div>
               )}

                         {activeTab === 'badges' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {badges.map((badge) => (
                   <Card key={badge.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
                 ))}
               </div>
             )}

             {activeTab === 'achievements' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {achievements.map((achievement) => (
                   <Card key={achievement.id} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
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
                           <span className="text-gray-600 dark:text-gray-400">Progress</span>
                           <span className="text-gray-900 dark:text-white font-medium">{achievement.progress} / {achievement.target}</span>
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
