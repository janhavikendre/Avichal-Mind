import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SummaryService } from '@/services/summary';
import { Summary } from '@/models/summary';
import { currentUser } from '@clerk/nextjs/server';

// GET - Fetch summary for a session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const phoneUserId = url.searchParams.get('phoneUserId');
    
    let userId: string;
    
    if (phoneUserId) {
      // Handle phone user
      const { User } = await import('@/models/user');
      const phoneUser = await User.findById(phoneUserId);
      if (!phoneUser) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
      userId = phoneUserId;
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
    }
    const sessionId = params.id;

    // Get the summary for this session
    const summary = await SummaryService.getSessionSummary(sessionId);
    
    if (!summary) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    // Verify ownership
    if (summary.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Generate or regenerate summary for a session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const phoneUserId = url.searchParams.get('phoneUserId');
    
    let userId: string;
    
    if (phoneUserId) {
      // Handle phone user
      const { User } = await import('@/models/user');
      const phoneUser = await User.findById(phoneUserId);
      if (!phoneUser) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
      userId = phoneUserId;
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
    }
    const sessionId = params.id;

    const body = await request.json();
    const { action, summaryType } = body;

    let result;
    
    if (action === 'regenerate') {
      console.log(`Regenerating summary for session ${sessionId}`);
      result = await SummaryService.regenerateSessionSummary(sessionId, { summaryType });
    } else {
      console.log(`Generating summary for session ${sessionId}`);
      result = await SummaryService.generateSessionSummary(sessionId);
    }

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 });
    }

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: result.message
      });
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      message: result.message
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Delete summary for a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const phoneUserId = url.searchParams.get('phoneUserId');
    
    let userId: string;
    
    if (phoneUserId) {
      // Handle phone user
      const { User } = await import('@/models/user');
      const phoneUser = await User.findById(phoneUserId);
      if (!phoneUser) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
      userId = phoneUserId;
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
    }
    const sessionId = params.id;

    // Verify the summary belongs to the user before deleting
    const summary = await Summary.findOne({ sessionId });
    if (summary && summary.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const success = await SummaryService.deleteSessionSummary(sessionId);
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to delete summary' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Summary deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting summary:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
