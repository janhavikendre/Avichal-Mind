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
    } else if (sessionStart.getTime() === lastSessionStart.getTime()) {
      // Same day, no change
      newStreak = user.streak.current;
    } else if (sessionStart.getTime() === lastSessionStart.getTime() + 24 * 60 * 60 * 1000) {
      // Next day, increment streak
      newStreak = user.streak.current + 1;
    } else if (sessionStart.getTime() > lastSessionStart.getTime() + 24 * 60 * 60 * 1000) {
      // Gap in streak, reset to 1
      newStreak = 1;
    }

    const longestStreak = Math.max(user.streak.longest, newStreak);

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
    const existingBadgeIds = user.badges.map(badge => badge.id);

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
  checkAchievements(user: IUser): Array<{ id: string; name: string; description: string; progress: number; target: number; completed: boolean }> {
    const updatedAchievements: Array<{ id: string; name: string; description: string; progress: number; target: number; completed: boolean }> = [];
    const existingAchievementIds = user.achievements.map(achievement => achievement.id);

    for (const achievement of this.achievements) {
      const progress = achievement.getProgress(user);
      const completed = progress >= achievement.target;
      const existingAchievement = user.achievements.find(a => a.id === achievement.id);

      if (!existingAchievement) {
        // New achievement
        updatedAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          progress,
          target: achievement.target,
          completed
        });
      } else if (existingAchievement.progress !== progress) {
        // Update existing achievement progress
        updatedAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          progress,
          target: achievement.target,
          completed
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
    const level = this.calculateLevel(user.points);
    const progressToNext = this.progressToNextLevel(user.points);
    const pointsForNext = this.pointsForNextLevel(level);

    const completedBadges = user.badges.length;
    const totalBadges = this.badges.length;
    const badgeProgress = (completedBadges / totalBadges) * 100;

    const completedAchievements = user.achievements.filter(a => a.completed).length;
    const totalAchievements = this.achievements.length;
    const achievementProgress = (completedAchievements / totalAchievements) * 100;

    return {
      level,
      points: user.points,
      progressToNext,
      pointsForNext,
      streak: user.streak,
      badgeProgress,
      achievementProgress,
      completedBadges,
      totalBadges,
      completedAchievements,
      totalAchievements
    };
  }
}

export const gamificationService = new GamificationService();
