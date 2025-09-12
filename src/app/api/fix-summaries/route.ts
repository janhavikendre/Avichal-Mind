import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { AIService } from '@/services/ai';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await getOrCreateUser(userId);

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get the session
    const session = await Session.findOne({
      _id: sessionId,
      userId: user._id,
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get messages for this session
    const messages = await Message.find({ sessionId: session._id })
      .sort({ createdAt: 1 });

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages found for session' }, { status: 400 });
    }

    // Convert messages to the format expected by AIService
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.contentText
    }));

    // Store the old summary before updating
    const oldSummary = session.summary || '';

    // Generate new summary with proper language detection
    // Let the AI service detect the actual conversation language instead of using session.language
    const newSummary = await AIService.generateSessionSummary(
      formattedMessages, 
      'en' // Pass 'en' as default, AI will detect actual language
    );

    console.log(`Generated summary for session ${sessionId}:`, {
      oldSummary: oldSummary.substring(0, 100) + '...',
      newSummary: newSummary.substring(0, 100) + '...',
      messageCount: messages.length,
      summaryGenerated: newSummary.length > 0
    });

    // Only update the session if a meaningful summary was generated
    if (newSummary && newSummary.trim().length > 0) {
      // Update the session with new summary and mark as completed if not already
      session.summary = newSummary;
      if (!session.completedAt) {
        session.completedAt = new Date();
      }
      
      // Save the session to database
      const savedSession = await session.save();
      
      console.log(`Session ${sessionId} updated successfully in database:`, {
        summaryLength: savedSession.summary?.length || 0,
        completedAt: savedSession.completedAt,
        messageCount: messages.length
      });

      return NextResponse.json({
        message: 'Summary generated and stored successfully in database',
        oldSummary: oldSummary,
        newSummary: newSummary,
        sessionId: session._id,
        completedAt: savedSession.completedAt,
        summaryLength: newSummary.length
      });
    } else {
      // No summary generated due to insufficient interaction
      console.log(`No summary generated for session ${sessionId} due to insufficient interaction`);
      
      return NextResponse.json({
        message: 'No summary generated - session has insufficient interaction for meaningful summary',
        oldSummary: oldSummary,
        newSummary: '',
        sessionId: session._id,
        reason: 'Insufficient interaction (need at least 3 user messages and 2 assistant responses)',
        messageCount: messages.length
      });
    }

  } catch (error) {
    console.error('Error fixing summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
