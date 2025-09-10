import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session as SessionModel } from '@/models/session';
import { Message as MessageModel } from '@/models/message';
import { User } from '@/models/user';
import { AIService } from '@/services/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { phoneUserId, language: requestLanguage } = body;

    // Check if user is authenticated (either Clerk or phone user)
    if (!userId && !phoneUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let user;
    if (userId) {
      // Clerk user - get the actual user from database
      user = await getOrCreateUser(userId);
    } else if (phoneUserId) {
      // Phone user
      user = await User.findById(phoneUserId);
      if (!user) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
    }

    const sessionId = params.id;

    const session = await SessionModel.findOne({
      _id: sessionId,
      userId: user._id
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch messages for transcript
    const messages = await MessageModel.find({ sessionId }).sort({ createdAt: 1 }).lean();
    
    if (messages.length === 0) {
      console.log('No messages found for session:', sessionId);
      return NextResponse.json({ error: 'No messages found for session' }, { status: 400 });
    }
    
    // Convert messages to the format expected by AIService
    const conversationHistory = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.contentText
    }));

    console.log('Generating summary for session:', sessionId, 'with', messages.length, 'messages');
    console.log('Session language:', session.language);
    console.log('Request language:', requestLanguage);
    console.log('OpenAI API key available:', !!process.env.OPENAI_API_KEY);

    // Use request language as fallback if session language is not available
    const summaryLanguage = (session.language || requestLanguage || 'en') as 'en' | 'hi' | 'mr';
    
    // Generate summary using AIService
    const summaryResponse = await AIService.generateSessionSummary(
      conversationHistory,
      summaryLanguage
    );

    console.log('Generated summary:', summaryResponse);

    const summaryText = summaryResponse || 'Summary unavailable.';

    session.summary = summaryText;
    await session.save();

    return NextResponse.json({ ok: true, summary: summaryText });
  } catch (err) {
    console.error('Summary generation error:', err);
    console.error('Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      sessionId: params.id
    });
    return NextResponse.json({ 
      error: 'Failed to generate summary',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}


