import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { geminiService } from '@/lib/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await getOrCreateUser(userId);

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, isAudio = false } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check for crisis content using Gemini service
    const hasCrisisContent = await geminiService.detectCrisisContent(content);

    if (hasCrisisContent) {
      // Update session with crisis flag
      session.safetyFlags.crisis = true;
      await session.save();

      return NextResponse.json({ 
        error: 'crisis_detected',
        message: 'Crisis content detected. Please contact emergency services immediately.'
      }, { status: 400 });
    }

    // Save user message
    const userMessage = new Message({
      sessionId: session._id,
      role: 'user',
      contentText: content,
      contentAudioUrl: isAudio ? 'audio_url_here' : null,
      tokensIn: content.length,
      tokensOut: 0,
    });
    await userMessage.save();

    // Generate AI response using Gemini
    const aiResponse = await geminiService.generateResponse(content, session.language);
    
    // Save AI message
    const assistantMessage = new Message({
      sessionId: session._id,
      role: 'assistant',
      contentText: aiResponse,
      contentAudioUrl: null, // TODO: Add TTS
      tokensIn: 0,
      tokensOut: aiResponse.length,
    });
    await assistantMessage.save();

    // Update session message count
    session.messageCount = (session.messageCount || 0) + 2;
    await session.save();

    return NextResponse.json({
      message: {
        _id: assistantMessage._id,
        role: 'assistant',
        contentText: aiResponse,
        contentAudioUrl: null,
        createdAt: assistantMessage.createdAt,
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


