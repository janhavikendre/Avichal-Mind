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

    // Perform a daily check-in and persist if changed
    const result = gamificationService.dailyCheckIn(user);
    if (result.updated) {
      user.streak.current = result.current;
      user.streak.longest = result.longest;
      user.streak.lastSessionDate = new Date();
      await user.save();
    }

    const streakInfo = gamificationService.getStreakInfo(user);
    const canContinue = gamificationService.canContinueStreak(user);

    return NextResponse.json({
      message: 'Daily streak check completed',
      streak: streakInfo,
      canContinueToday: canContinue,
      updated: result.updated,
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

    // Force a daily check-in (manual click)
    const result = gamificationService.dailyCheckIn(user);
    if (result.updated) {
      user.streak.current = result.current;
      user.streak.longest = result.longest;
      user.streak.lastSessionDate = new Date();
      await user.save();
    }

    return NextResponse.json({
      message: 'Daily check-in processed',
      streak: { current: user.streak.current, longest: user.streak.longest },
      updated: result.updated
    });
  } catch (error) {
    console.error('Error in forced daily streak update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
