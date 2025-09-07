import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { User } from '@/models/user';
import { gamificationService } from '@/lib/gamification';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const phoneUserId = searchParams.get('phoneUserId');

    // Check if user is authenticated (either Clerk or phone user)
    if (!userId && !phoneUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let user;
    if (userId) {
      // Clerk user
      user = await getOrCreateUser(userId);
    } else if (phoneUserId) {
      // Phone user
      user = await User.findById(phoneUserId);
      if (!user) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
    }

    // Ensure user has the required structure for gamification (migrate old users)
    if (!user.stats) {
      user.stats = {
        totalSessions: 0,
        totalMessages: 0,
        totalMinutes: 0,
        crisisSessions: 0,
        firstSessionDate: null,
        lastSessionDate: null,
        languagesUsed: [],
        modesUsed: []
      };
    }
    
    if (!user.stats.languagesUsed) {
      user.stats.languagesUsed = [];
    }
    
    if (!user.stats.modesUsed) {
      user.stats.modesUsed = [];
    }
    
    if (!user.streak || typeof user.streak === 'number') {
      user.streak = {
        current: typeof user.streak === 'number' ? user.streak : 0,
        longest: typeof user.streak === 'number' ? user.streak : 0,
        lastSessionDate: null
      };
    }

    // Get user progress summary
    console.log('User data for gamification:', {
      id: user._id,
      points: user.points,
      level: user.level,
      streak: user.streak,
      badges: user.badges.length,
      achievements: user.achievements.length,
      stats: user.stats
    });
    
    const progress = gamificationService.getUserProgress(user);
    console.log('Generated progress:', progress);
    
    // Check and validate streak integrity
    const streakValidation = gamificationService.validateStreakIntegrity(user);
    if (streakValidation.needsUpdate) {
      console.log('Streak validation: Updating streak in database:', {
        userId: user.clerkUserId,
        oldStreak: user.streak.current,
        newStreak: streakValidation.newStreak.current,
        lastSession: user.streak.lastSessionDate,
        reason: 'Daily streak check or integrity validation'
      });
      
      // Update the user's streak in the database
      user.streak.current = streakValidation.newStreak.current;
      user.streak.longest = streakValidation.newStreak.longest;
      await user.save();
      
      console.log('Streak updated successfully in database');
    }

    // Get user's badges
    const badges = user.badges.map((badge: any) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      unlockedAt: badge.unlockedAt
    }));

    // Get user's achievements with current progress
    const achievements = gamificationService.checkAchievements(user).map((achievement: any) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      progress: achievement.progress,
      target: achievement.target,
      completed: achievement.completed,
      category: achievement.category
    }));
    
    // Check for new achievements and update user if needed
    const newAchievements = gamificationService.checkAchievements(user);
    let needsUpdate = false;
    
    for (const achievement of newAchievements) {
      const existingAchievement = user.achievements.find((a: any) => a.id === achievement.id);
      if (!existingAchievement) {
        // Add new achievement
        user.achievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          progress: achievement.progress,
          target: achievement.target,
          completed: achievement.completed,
          completedAt: achievement.completed ? new Date() : undefined,
          category: achievement.category as any
        });
        needsUpdate = true;
      } else if (existingAchievement.progress !== achievement.progress) {
        // Update existing achievement progress
        existingAchievement.progress = achievement.progress;
        if (achievement.completed && !existingAchievement.completed) {
          existingAchievement.completed = true;
          existingAchievement.completedAt = new Date();
        }
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await user.save();
      console.log('Updated user achievements');
    }

    return NextResponse.json({
      progress,
      badges,
      achievements
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
