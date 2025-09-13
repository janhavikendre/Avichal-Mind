import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SummaryService } from '@/services/summary';
import { currentUser } from '@clerk/nextjs/server';

// GET - Fetch all summaries for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const phoneUserId = url.searchParams.get('phoneUserId');
    
    let userId: string;
    
    if (phoneUserId) {
      // Handle phone user - Fixed: Use phoneUserId directly as userId
      const { User } = await import('@/models/user');
      const phoneUser = await User.findById(phoneUserId);
      if (!phoneUser) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
      userId = phoneUserId; // Use phoneUserId directly as the userId for summaries
      console.log('Phone user summaries requested for userId:', userId);
    } else {
      // Handle Clerk user
      const user = await currentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Find the user in the database using Clerk ID
      const { User } = await import('@/models/user');
      const dbUser = await User.findOne({ clerkUserId: user.id });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
      userId = dbUser._id.toString();
      console.log('Clerk user summaries requested for userId:', userId);
    }

    const language = url.searchParams.get('language') as 'en' | 'hi' | 'mr' | null;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const sortBy = url.searchParams.get('sortBy') as 'generatedAt' | 'version' || 'generatedAt';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    const summaries = await SummaryService.getUserSummaries(userId, {
      language: language || undefined,
      limit,
      skip,
      sortBy,
      sortOrder
    });

    // Get summary statistics
    const stats = await SummaryService.getUserSummaryStats(userId);

    return NextResponse.json({
      success: true,
      summaries,
      stats,
      pagination: {
        limit,
        skip,
        total: stats.totalSummaries
      }
    });

  } catch (error) {
    console.error('Error fetching summaries:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Bulk operations on summaries
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();
    const { action, sessionIds } = body;

    if (action === 'bulk_generate') {
      const results = [];
      
      for (const sessionId of sessionIds) {
        console.log(`Generating summary for session ${sessionId}`);
        const result = await SummaryService.generateSessionSummary(sessionId);
        results.push({
          sessionId,
          success: result.success,
          message: result.message,
          skipped: result.skipped
        });
      }

      return NextResponse.json({
        success: true,
        results
      });
    }

    if (action === 'bulk_regenerate') {
      const results = [];
      
      for (const sessionId of sessionIds) {
        console.log(`Regenerating summary for session ${sessionId}`);
        const result = await SummaryService.regenerateSessionSummary(sessionId);
        results.push({
          sessionId,
          success: result.success,
          message: result.message,
          skipped: result.skipped
        });
      }

      return NextResponse.json({
        success: true,
        results
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
