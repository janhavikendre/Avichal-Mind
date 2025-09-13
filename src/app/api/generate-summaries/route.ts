import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SummaryService } from '@/services/summary';
import { Session } from '@/models/session';
import { currentUser } from '@clerk/nextjs/server';

// POST - Generate summaries for sessions that don't have them
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneUserId, sessionIds } = body;

    // Get user ID
    let userId: string;
    if (phoneUserId) {
      userId = phoneUserId;
    } else {
      const { User } = await import('@/models/user');
      const dbUser = await User.findOne({ clerkUserId: user.id });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
      userId = dbUser._id.toString();
    }

    // Get sessions that need summaries - More aggressive approach
    let sessions;
    if (sessionIds && sessionIds.length > 0) {
      // Generate summaries for specific sessions
      sessions = await Session.find({
        _id: { $in: sessionIds },
        userId: userId
      });
    } else {
      // Fixed: More aggressive - generate summaries for ALL sessions with messages
      sessions = await Session.find({
        userId: userId,
        messageCount: { $gt: 0 } // Only sessions with messages
      }).sort({ startedAt: -1 }); // Most recent first
    }

    console.log(`Found ${sessions.length} sessions to generate summaries for`);

    const results = [];
    for (const session of sessions) {
      try {
        console.log(`Generating summary for session ${session._id} (force mode)`);
        const result = await SummaryService.generateSessionSummary(session._id.toString(), true);
        
        results.push({
          sessionId: session._id,
          success: result.success,
          message: result.message,
          skipped: result.skipped,
          summaryLength: result.summary?.content?.length || 0
        });
      } catch (error) {
        console.error(`Error generating summary for session ${session._id}:`, error);
        results.push({
          sessionId: session._id,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          skipped: false,
          summaryLength: 0
        });
      }
    }

    const successCount = results.filter(r => r.success && !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} summaries, skipped ${skippedCount}, failed ${failedCount}`,
      results,
      stats: {
        total: sessions.length,
        successful: successCount,
        skipped: skippedCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error('Error generating summaries:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
