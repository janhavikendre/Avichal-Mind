import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { gamificationService } from '@/lib/gamification';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await getOrCreateUser(userId);

    // Get user progress summary
    const progress = gamificationService.getUserProgress(user);

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
