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

    // Get detailed streak information
    const streakInfo = gamificationService.getStreakInfo(user);
    
    // Check if streak can be continued today
    const canContinue = gamificationService.canContinueStreak(user);
    
    // Validate streak integrity
    const streakValidation = gamificationService.validateStreakIntegrity(user);
    
    // If streak needs update, update it in the database
    if (streakValidation.needsUpdate) {
      console.log('Daily streak check: Updating streak in database:', {
        userId: user.clerkUserId,
        oldStreak: user.streak.current,
        newStreak: streakValidation.newStreak.current,
        reason: 'Daily streak validation'
      });
      
      user.streak.current = streakValidation.newStreak.current;
      user.streak.longest = streakValidation.newStreak.longest;
      await user.save();
      
      // Update streak info with new data
      streakInfo.current = streakValidation.newStreak.current;
      streakInfo.longest = streakValidation.newStreak.longest;
    }

    return NextResponse.json({
      message: 'Daily streak check completed',
      streak: streakInfo,
      canContinueToday: canContinue,
      needsUpdate: streakValidation.needsUpdate,
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in daily streak check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await getOrCreateUser(userId);

    // Force a daily streak validation and update
    const streakValidation = gamificationService.validateStreakIntegrity(user);
    
    if (streakValidation.needsUpdate) {
      console.log('Forced daily streak update:', {
        userId: user.clerkUserId,
        oldStreak: user.streak.current,
        newStreak: streakValidation.newStreak.current,
        reason: 'Forced daily update'
      });
      
      user.streak.current = streakValidation.newStreak.current;
      user.streak.longest = streakValidation.newStreak.longest;
      await user.save();
      
      return NextResponse.json({
        message: 'Streak updated successfully',
        oldStreak: user.streak.current,
        newStreak: streakValidation.newStreak.current,
        streak: streakValidation.newStreak,
        updated: true
      });
    }

    return NextResponse.json({
      message: 'Streak is current, no update needed',
      streak: user.streak,
      updated: false
    });
  } catch (error) {
    console.error('Error in forced daily streak update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
