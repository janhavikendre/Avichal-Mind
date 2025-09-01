import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Session } from '@/models/session';
import { User } from '@/models/user';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔍 Testing database connection and sessions...');
    
    // Get all sessions
    const allSessions = await Session.find({}).sort({ startedAt: -1 });
    console.log(`📊 Total sessions in database: ${allSessions.length}`);
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`👥 Total users in database: ${allUsers.length}`);
    
    // Group sessions by user
    const sessionsByUser: Record<string, Array<{
      id: any;
      startedAt: Date;
      completedAt?: Date;
      language: string;
      mode: string;
      summary: string;
    }>> = {};
    
    for (const session of allSessions) {
      const userId = session.userId.toString();
      if (!sessionsByUser[userId]) {
        sessionsByUser[userId] = [];
      }
      sessionsByUser[userId].push({
        id: session._id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        language: session.language,
        mode: session.mode,
        summary: session.summary ? 'Has summary' : 'No summary'
      });
    }
    
    console.log('📅 Sessions by user:', sessionsByUser);
    
    return NextResponse.json({
      totalSessions: allSessions.length,
      totalUsers: allUsers.length,
      sessionsByUser,
      allSessions: allSessions.map(s => ({
        id: s._id,
        userId: s.userId,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        language: s.language,
        mode: s.mode,
        summary: s.summary ? 'Has summary' : 'No summary'
      }))
    });
    
  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
