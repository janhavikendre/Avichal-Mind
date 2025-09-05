import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await getOrCreateUser(userId);

    console.log('🔍 Testing session count for user:', user._id);

    // Get all sessions for this user
    const allSessions = await Session.find({ userId: user._id });
    const totalCount = allSessions.length;

    // Get sessions with limit (like the main API)
    const limitedSessions = await Session.find({ userId: user._id })
      .sort({ startedAt: -1 })
      .limit(1000);

    // Get this month's sessions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSessions = allSessions.filter(s => 
      new Date(s.startedAt) >= startOfMonth
    );

    // Get total messages
    const totalMessages = allSessions.reduce((sum, session) => sum + (session.messageCount || 0), 0);

    console.log('📊 Session count test results:', {
      userId: user._id,
      totalSessionsInDB: totalCount,
      limitedSessionsReturned: limitedSessions.length,
      thisMonthSessions: thisMonthSessions.length,
      totalMessages,
      sampleSessionDates: allSessions.slice(0, 5).map(s => ({
        id: s._id,
        startedAt: s.startedAt,
        messageCount: s.messageCount
      }))
    });

    return NextResponse.json({
      userId: user._id,
      totalSessionsInDB: totalCount,
      limitedSessionsReturned: limitedSessions.length,
      thisMonthSessions: thisMonthSessions.length,
      totalMessages,
      sampleSessions: allSessions.slice(0, 10).map(s => ({
        id: s._id,
        startedAt: s.startedAt,
        messageCount: s.messageCount,
        mode: s.mode,
        language: s.language
      }))
    });
  } catch (error) {
    console.error('Error testing session count:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
