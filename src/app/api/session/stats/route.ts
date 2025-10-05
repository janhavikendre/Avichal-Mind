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

    console.log(`🔍 Fetching session stats for user ${user._id}`);

    // Count total sessions (ALL sessions the user created)
    const totalAllSessions = await Session.countDocuments({ userId: user._id });

    // Count sessions with conversations (messageCount > 0)
    const totalSessionsWithConversations = await Session.countDocuments({ 
      userId: user._id, 
      messageCount: { $gt: 0 } 
    });

    // Count by mode (only sessions with conversations)
    const textSessions = await Session.countDocuments({ 
      userId: user._id, 
      mode: 'text',
      messageCount: { $gt: 0 } 
    });

    const voiceSessions = await Session.countDocuments({ 
      userId: user._id, 
      mode: 'voice',
      messageCount: { $gt: 0 } 
    });

    // Count by language (only sessions with conversations)
    const englishSessions = await Session.countDocuments({ 
      userId: user._id, 
      language: 'en',
      messageCount: { $gt: 0 } 
    });

    const hindiSessions = await Session.countDocuments({ 
      userId: user._id, 
      language: 'hi',
      messageCount: { $gt: 0 } 
    });

    const marathiSessions = await Session.countDocuments({ 
      userId: user._id, 
      language: 'mr',
      messageCount: { $gt: 0 } 
    });

    // Get total messages across all sessions with conversations
    const messageStats = await Session.aggregate([
      { 
        $match: { 
          userId: user._id, 
          messageCount: { $gt: 0 } 
        } 
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: '$messageCount' },
          avgMessages: { $avg: '$messageCount' }
        }
      }
    ]);

    const stats = {
      totalSessions: totalAllSessions, // Show ALL sessions created by user
      totalSessionsWithConversations, // Sessions that actually have messages
      sessionsByMode: {
        text: textSessions,
        voice: voiceSessions
      },
      sessionsByLanguage: {
        en: englishSessions,
        hi: hindiSessions,
        mr: marathiSessions
      },
      messageStats: messageStats.length > 0 ? {
        totalMessages: messageStats[0].totalMessages,
        avgMessagesPerSession: Math.round(messageStats[0].avgMessages || 0)
      } : {
        totalMessages: 0,
        avgMessagesPerSession: 0
      }
    };

    console.log(`✅ Session stats for user ${user._id}:`, stats);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}