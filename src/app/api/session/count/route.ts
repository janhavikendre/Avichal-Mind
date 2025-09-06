import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { User } from '@/models/user';

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

    // Get total session count
    const totalSessions = await Session.countDocuments({ userId: user._id });

    // Get this month's sessions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSessions = await Session.countDocuments({
      userId: user._id,
      startedAt: { $gte: startOfMonth }
    });

    // Get total messages across all sessions
    const sessions = await Session.find({ userId: user._id }).select('messageCount');
    const totalMessages = sessions.reduce((sum, session) => sum + (session.messageCount || 0), 0);

    // Get text and voice session counts
    const textSessions = await Session.countDocuments({ userId: user._id, mode: 'text' });
    const voiceSessions = await Session.countDocuments({ userId: user._id, mode: 'voice' });

    // Get completed sessions count
    const completedSessions = await Session.countDocuments({ 
      userId: user._id, 
      completedAt: { $exists: true, $ne: null } 
    });

    // Get crisis sessions count
    const crisisSessions = await Session.countDocuments({ 
      userId: user._id, 
      'safetyFlags.crisis': true 
    });

    console.log(`📊 Session counts for user ${user._id}:`, {
      totalSessions,
      thisMonthSessions,
      totalMessages,
      textSessions,
      voiceSessions,
      completedSessions,
      crisisSessions
    });

    return NextResponse.json({
      totalSessions,
      thisMonthSessions,
      totalMessages,
      textSessions,
      voiceSessions,
      completedSessions,
      crisisSessions
    });
  } catch (error) {
    console.error('Error fetching session counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
