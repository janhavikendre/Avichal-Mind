import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { User } from '@/models/user';
import { gamificationService } from '@/lib/gamification';

export async function POST(request: NextRequest) {
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
      streak: user.streak
    });
  } catch (error) {
    console.error('Error refreshing streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
