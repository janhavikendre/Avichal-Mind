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

    // Detect the actual language from the conversation
    const detectedLanguage = AIService.detectSessionLanguage(formattedMessages);
    
    console.log(`Language detection for session ${sessionId}:`, {
      originalLanguage: session.language,
      detectedLanguage: detectedLanguage,
      messageCount: messages.length,
      userMessages: formattedMessages.filter(m => m.role === 'user').length
    });

    // Update the session language if it's different
    const languageUpdated = session.language !== detectedLanguage;
    if (languageUpdated) {
      session.language = detectedLanguage;
      await session.save();
      
      console.log(`Updated session ${sessionId} language from ${session.language} to ${detectedLanguage}`);
    }

    return NextResponse.json({
      message: 'Language detection completed',
      sessionId: session._id,
      originalLanguage: session.language,
      detectedLanguage: detectedLanguage,
      languageUpdated: languageUpdated,
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Error fixing language detection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
