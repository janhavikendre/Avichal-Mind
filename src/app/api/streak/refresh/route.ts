import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { gamificationService } from '@/lib/gamification';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await getOrCreateUser(userId);

    // Validate and check streak integrity
    const streakValidation = gamificationService.validateStreakIntegrity(user);
    
    if (streakValidation.needsUpdate) {
      console.log('Refreshing streak:', {
        userId: user.clerkUserId,
        oldStreak: user.streak.current,
        newStreak: streakValidation.newStreak.current,
        lastSession: user.streak.lastSessionDate,
        reason: 'Manual refresh with validation'
      });
      
      // Update the user's streak
      user.streak.current = streakValidation.newStreak.current;
      user.streak.longest = streakValidation.newStreak.longest;
      await user.save();
      
      return NextResponse.json({
        message: 'Streak refreshed successfully',
        oldStreak: user.streak.current,
        newStreak: streakValidation.newStreak.current,
        streak: streakValidation.newStreak,
        updated: true
      });
    }

    return NextResponse.json({
      message: 'Streak is current',
      streak: currentStreak
    });
  } catch (error) {
    console.error('Error refreshing streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
