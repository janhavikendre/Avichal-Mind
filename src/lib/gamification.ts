import { IUser } from '@/models/user';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'consistency' | 'milestone' | 'special' | 'language' | 'mode';
  condition: (user: IUser) => boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'sessions' | 'messages' | 'streak' | 'languages' | 'modes';
  target: number;
  getProgress: (user: IUser) => number;
}

class GamificationService {
  // Badge definitions
  private badges: Badge[] = [
    // Consistency badges
    {
      id: 'first_session',
      name: 'First Steps',
      description: 'Complete your first wellness session',
      icon: '🌟',
      category: 'consistency',
      condition: (user) => user.stats.totalSessions >= 1
    },
    {
      id: 'week_streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      category: 'consistency',
      condition: (user) => user.streak.current >= 7
    },
    {
      id: 'month_streak',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '💎',
      category: 'consistency',
      condition: (user) => user.streak.current >= 30
    },
    {
      id: 'hundred_sessions',
      name: 'Century Club',
      description: 'Complete 100 sessions',
      icon: '🏆',
      category: 'milestone',
      condition: (user) => user.stats.totalSessions >= 100
    },
    {
      id: 'thousand_messages',
      name: 'Chat Champion',
      description: 'Send 1000 messages',
      icon: '💬',
      category: 'milestone',
      condition: (user) => user.stats.totalMessages >= 1000
    },
    {
      id: 'multilingual',
      name: 'Polyglot',
      description: 'Use all three languages (English, Hindi, Marathi)',
      icon: '🌍',
      category: 'language',
      condition: (user) => user.stats.languagesUsed.length >= 3
    },
    {
      id: 'voice_explorer',
      name: 'Voice Explorer',
      description: 'Try voice sessions',
      icon: '🎤',
      category: 'mode',
      condition: (user) => user.stats.modesUsed.includes('voice')
    },
    {
      id: 'text_master',
      name: 'Text Master',
      description: 'Complete 50 text sessions',
      icon: '✍️',
      category: 'mode',
      condition: (user) => user.stats.modesUsed.includes('text') && user.stats.totalSessions >= 50
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete a session before 8 AM',
      icon: '🌅',
      category: 'special',
      condition: (user) => {
        if (!user.stats.lastSessionDate) return false;
        const hour = new Date(user.stats.lastSessionDate).getHours();
        return hour < 8;
      }
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Complete a session after 10 PM',
      icon: '🦉',
      category: 'special',
      condition: (user) => {
        if (!user.stats.lastSessionDate) return false;
        const hour = new Date(user.stats.lastSessionDate).getHours();
        return hour >= 22;
      }
    }
  ];

  // Achievement definitions
  private achievements: Achievement[] = [
    // Session achievements
    {
      id: 'sessions_10',
      name: 'Getting Started',
      description: 'Complete 10 sessions',
      category: 'sessions',
      target: 10,
      getProgress: (user) => Math.min(user.stats.totalSessions, 10)
    },
    {
      id: 'sessions_50',
      name: 'Regular User',
      description: 'Complete 50 sessions',
      category: 'sessions',
      target: 50,
      getProgress: (user) => Math.min(user.stats.totalSessions, 50)
    },
    {
      id: 'sessions_100',
      name: 'Dedicated Wellness Seeker',
      description: 'Complete 100 sessions',
      category: 'sessions',
      target: 100,
      getProgress: (user) => Math.min(user.stats.totalSessions, 100)
    },
    // Message achievements
    {
      id: 'messages_100',
      name: 'Conversation Starter',
      description: 'Send 100 messages',
      category: 'messages',
      target: 100,
      getProgress: (user) => Math.min(user.stats.totalMessages, 100)
    },
    {
      id: 'messages_500',
      name: 'Active Communicator',
      description: 'Send 500 messages',
      category: 'messages',
      target: 500,
      getProgress: (user) => Math.min(user.stats.totalMessages, 500)
    },
    {
      id: 'messages_1000',
      name: 'Chat Master',
      description: 'Send 1000 messages',
      category: 'messages',
      target: 1000,
      getProgress: (user) => Math.min(user.stats.totalMessages, 1000)
    },
    // Streak achievements
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      category: 'streak',
      target: 7,
      getProgress: (user) => Math.min(user.streak.current, 7)
    },
    {
      id: 'streak_30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      category: 'streak',
      target: 30,
      getProgress: (user) => Math.min(user.streak.current, 30)
    },
    {
      id: 'streak_100',
      name: 'Century Streak',
      description: 'Maintain a 100-day streak',
      category: 'streak',
      target: 100,
      getProgress: (user) => Math.min(user.streak.current, 100)
    },
    // Language achievements
    {
      id: 'languages_2',
      name: 'Bilingual',
      description: 'Use 2 different languages',
      category: 'languages',
      target: 2,
      getProgress: (user) => Math.min(user.stats.languagesUsed.length, 2)
    },
    {
      id: 'languages_3',
      name: 'Trilingual',
      description: 'Use all 3 languages',
      category: 'languages',
      target: 3,
      getProgress: (user) => Math.min(user.stats.languagesUsed.length, 3)
    },
    // Mode achievements
    {
      id: 'modes_2',
      name: 'Versatile User',
      description: 'Use both text and voice modes',
      category: 'modes',
      target: 2,
      getProgress: (user) => Math.min(user.stats.modesUsed.length, 2)
    }
  ];

  // Calculate user level based on points
  calculateLevel(points: number): number {
    return Math.floor(points / 100) + 1;
  }

  // Calculate points needed for next level
  pointsForNextLevel(level: number): number {
    return level * 100;
  }

  // Calculate progress to next level
  progressToNextLevel(points: number): number {
    const currentLevel = this.calculateLevel(points);
    const pointsForCurrentLevel = (currentLevel - 1) * 100;
    const pointsInCurrentLevel = points - pointsForCurrentLevel;
    return (pointsInCurrentLevel / 100) * 100;
  }

  // Update streak based on session date
  updateStreak(user: IUser, sessionDate: Date): { current: number; longest: number } {
    const today = new Date();
    const lastSession = user.streak.lastSessionDate ? new Date(user.streak.lastSessionDate) : null;
    
    // Reset date to start of day for comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sessionStart = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    const lastSessionStart = lastSession ? new Date(lastSession.getFullYear(), lastSession.getMonth(), lastSession.getDate()) : null;

    let newStreak = user.streak.current;

    if (!lastSessionStart) {
      // First session
      newStreak = 1;
      console.log('First session - setting streak to 1');
    } else if (sessionStart.getTime() === lastSessionStart.getTime()) {
      // Same day, no change
      newStreak = user.streak.current;
      console.log('Same day session - streak unchanged:', newStreak);
    } else {
      // Calculate the difference in days
      const timeDiff = sessionStart.getTime() - lastSessionStart.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      console.log('Days difference:', daysDiff, 'Current streak:', user.streak.current);
      
      if (daysDiff === 1) {
        // Next consecutive day, increment streak
        newStreak = user.streak.current + 1;
        console.log('Next consecutive day - incrementing streak to:', newStreak);
      } else if (daysDiff > 1) {
        // Gap in streak, reset to 1
        newStreak = 1;
        console.log('Gap in streak - resetting to 1');
      } else {
        // If daysDiff < 1, it's the same day or earlier, no change
        console.log('Earlier day or same day - streak unchanged:', newStreak);
      }
    }

    const longestStreak = Math.max(user.streak.longest, newStreak);

    console.log('Streak update result:', {
      current: newStreak,
      longest: longestStreak,
      sessionDate: sessionDate.toISOString(),
      lastSessionDate: lastSessionStart?.toISOString()
    });

    return {
      current: newStreak,
      longest: longestStreak
    };
  }

  // Award points for completing a session
  awardSessionPoints(session: any): number {
    let points = 10; // Base points for completing a session

    // Bonus points for longer sessions
    if (session.messageCount >= 10) points += 5;
    if (session.messageCount >= 20) points += 10;

    // Bonus points for voice sessions
    if (session.mode === 'voice') points += 5;

    // Bonus points for different languages
    if (session.language === 'hi' || session.language === 'mr') points += 3;

    return points;
  }

  // Check and award badges
  checkBadges(user: IUser): Array<{ id: string; name: string; description: string; icon: string; category: string }> {
    const unlockedBadges: Array<{ id: string; name: string; description: string; icon: string; category: string }> = [];
    const existingBadgeIds = user.badges.map((badge: any) => badge.id);

    for (const badge of this.badges) {
      if (!existingBadgeIds.includes(badge.id) && badge.condition(user)) {
        unlockedBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category
        });
      }
    }

    return unlockedBadges;
  }

  // Check and update achievements
  checkAchievements(user: IUser): Array<{ id: string; name: string; description: string; progress: number; target: number; completed: boolean; category: string }> {
    const updatedAchievements: Array<{ id: string; name: string; description: string; progress: number; target: number; completed: boolean; category: string }> = [];
    const existingAchievementIds = user.achievements.map((achievement: any) => achievement.id);

    for (const achievement of this.achievements) {
      const progress = achievement.getProgress(user);
      const completed = progress >= achievement.target;
      const existingAchievement = user.achievements.find((a: any) => a.id === achievement.id);

             if (!existingAchievement) {
         // New achievement
         updatedAchievements.push({
           id: achievement.id,
           name: achievement.name,
           description: achievement.description,
           progress,
           target: achievement.target,
           completed,
           category: achievement.category
         });
       } else if (existingAchievement.progress !== progress) {
         // Update existing achievement progress
         updatedAchievements.push({
           id: achievement.id,
           name: achievement.name,
           description: achievement.description,
           progress,
           target: achievement.target,
           completed,
           category: achievement.category
         });
       }
    }

    return updatedAchievements;
  }

  // Get all available badges
  getAllBadges(): Badge[] {
    return this.badges;
  }

  // Get all available achievements
  getAllAchievements(): Achievement[] {
    return this.achievements;
  }

  // Get user's progress summary
  getUserProgress(user: IUser) {
    // Ensure streak is current by checking if it needs to be updated
    const currentStreak = this.getCurrentStreak(user);
    
    const level = this.calculateLevel(user.points || 0);
    const progressToNext = this.progressToNextLevel(user.points || 0);
    const pointsForNext = this.pointsForNextLevel(level);

    const completedBadges = (user.badges || []).length;
    const totalBadges = this.badges.length;
    const badgeProgress = (completedBadges / totalBadges) * 100;

    const completedAchievements = (user.achievements || []).filter(a => a.completed).length;
    const totalAchievements = this.achievements.length;
    const achievementProgress = (completedAchievements / totalAchievements) * 100;

    return {
      level,
      points: user.points || 0,
      progressToNext,
      pointsToNext: pointsForNext,
      streak: currentStreak,
      badgeProgress,
      achievementProgress,
      completedBadges,
      totalBadges,
      completedAchievements,
      totalAchievements
    };
  }

  // Get current streak without updating the user object
  getCurrentStreak(user: IUser) {
    const today = new Date();
    
    // Handle old streak structure
    if (!user.streak || typeof user.streak === 'number') {
      return { current: 0, longest: 0 };
    }
    
    const lastSession = user.streak.lastSessionDate ? new Date(user.streak.lastSessionDate) : null;
    
    if (!lastSession) {
      return { current: 0, longest: user.streak.longest || 0 };
    }
    
    // Calculate days since last session
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSessionStart = new Date(lastSession.getFullYear(), lastSession.getMonth(), lastSession.getDate());
    const timeDiff = todayStart.getTime() - lastSessionStart.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) {
      // Same day, return current streak
      return user.streak;
    } else if (daysDiff === 1) {
      // Yesterday, streak is still valid
      return user.streak;
    } else if (daysDiff > 1) {
      // Streak broken, return 0
      return { current: 0, longest: user.streak.longest };
    }
    
    return user.streak;
  }

  // Check and update daily streak status
  checkDailyStreak(user: IUser): { needsUpdate: boolean; newStreak: { current: number; longest: number } } {
    const today = new Date();
    const lastSession = user.streak.lastSessionDate ? new Date(user.streak.lastSessionDate) : null;
    
    if (!lastSession) {
      return { needsUpdate: false, newStreak: user.streak };
    }
    
    // Calculate days since last session
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSessionStart = new Date(lastSession.getFullYear(), lastSession.getMonth(), lastSession.getDate());
    const timeDiff = todayStart.getTime() - lastSessionStart.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // If it's been more than 1 day since the last session, the streak should be reset
    if (daysDiff > 1) {
      const newStreak = {
        current: 0,
        longest: user.streak.longest // Keep the longest streak record
      };
      
      console.log('Daily streak check: Streak broken after', daysDiff, 'days. Resetting to 0.');
      return { needsUpdate: true, newStreak };
    }
    
    return { needsUpdate: false, newStreak: user.streak };
  }

  // Validate and fix streak data integrity
  validateStreakIntegrity(user: IUser): { needsUpdate: boolean; newStreak: { current: number; longest: number } } {
    const currentStreak = this.getCurrentStreak(user);
    const dailyCheck = this.checkDailyStreak(user);
    
    // If the current streak calculation differs from stored streak, update is needed
    if (currentStreak.current !== user.streak.current) {
      console.log('Streak integrity check: Stored streak differs from calculated streak', {
        stored: user.streak.current,
        calculated: currentStreak.current
      });
      return { needsUpdate: true, newStreak: currentStreak };
    }
    
    // If daily check indicates update is needed
    if (dailyCheck.needsUpdate) {
      return dailyCheck;
    }
    
    return { needsUpdate: false, newStreak: user.streak };
  }

  // Get detailed streak information
  getStreakInfo(user: IUser) {
    const currentStreak = this.getCurrentStreak(user);
    const lastSession = user.streak.lastSessionDate ? new Date(user.streak.lastSessionDate) : null;
    
    if (!lastSession) {
      return {
        current: 0,
        longest: user.streak.longest,
        lastSessionDate: null,
        daysSinceLastSession: null,
        isActive: false,
        nextMilestone: 7,
        progressToNextMilestone: 0
      };
    }
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSessionStart = new Date(lastSession.getFullYear(), lastSession.getMonth(), lastSession.getDate());
    const timeDiff = todayStart.getTime() - lastSessionStart.getTime();
    const daysSinceLastSession = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Determine if streak is still active (within 1 day)
    const isActive = daysSinceLastSession <= 1;
    
    // Find next milestone
    let nextMilestone = 7;
    if (currentStreak.current >= 7) nextMilestone = 30;
    if (currentStreak.current >= 30) nextMilestone = 100;
    if (currentStreak.current >= 100) nextMilestone = 365;
    
    const progressToNextMilestone = Math.min((currentStreak.current / nextMilestone) * 100, 100);
    
    return {
      current: currentStreak.current,
      longest: user.streak.longest,
      lastSessionDate: lastSession,
      daysSinceLastSession,
      isActive,
      nextMilestone,
      progressToNextMilestone
    };
  }

  // Check if user can continue streak today
  canContinueStreak(user: IUser): boolean {
    const lastSession = user.streak.lastSessionDate ? new Date(user.streak.lastSessionDate) : null;
    
    if (!lastSession) return true; // First session
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSessionStart = new Date(lastSession.getFullYear(), lastSession.getMonth(), lastSession.getDate());
    const timeDiff = todayStart.getTime() - lastSessionStart.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Can continue if it's the same day or the next day
    return daysDiff <= 1;
  }

  // Perform a daily check-in: increments streak if last session was yesterday, keeps it if today, resets if gap
  dailyCheckIn(user: IUser): { current: number; longest: number; updated: boolean } {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSession = user.streak.lastSessionDate ? new Date(user.streak.lastSessionDate) : null;

    let current = user.streak.current || 0;
    let longest = user.streak.longest || 0;
    let updated = false;

    if (!lastSession) {
      current = 1;
      updated = true;
    } else {
      const lastStart = new Date(lastSession.getFullYear(), lastSession.getMonth(), lastSession.getDate());
      const daysDiff = Math.floor((todayStart.getTime() - lastStart.getTime()) / (1000 * 3600 * 24));
      if (daysDiff === 0) {
        // already checked today; no change
      } else if (daysDiff === 1) {
        current = current + 1;
        updated = true;
      } else if (daysDiff > 1) {
        current = 1;
        updated = true;
      }
    }

    longest = Math.max(longest, current);
    return { current, longest, updated };
  }
}

export const gamificationService = new GamificationService();
