import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { AIService } from '@/services/ai';
import { youtubeService } from '@/lib/youtube';
import { gamificationService } from '@/lib/gamification';

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

    // Get conversation history for context
    const conversationHistory = await Message.find({ sessionId: session._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .then(messages => messages.reverse().map(msg => ({
        role: msg.role,
        content: msg.contentText
      })));

    // Check for crisis content
    const hasCrisisContent = await AIService.detectCrisisContent(content);

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

    // Generate AI response using the improved AI service
    const aiResponse = await AIService.generateResponse(
      content, 
      session.language, 
      user.firstName || 'User',
      conversationHistory
    );
    
    // Only get video suggestions if the AI service indicates it's appropriate
    let videoSuggestions: any[] = [];
    let enhancedResponse = aiResponse.text;
    
    if (aiResponse.shouldSuggestVideos) {
      try {
        // Create conversation context for video search
        const conversationContext = `${content} ${aiResponse.text}`;
        videoSuggestions = await youtubeService.getRelevantVideos(conversationContext, session.language);
        
        // Enhance AI response to naturally mention the videos
        if (videoSuggestions.length > 0) {
          const videoMention = session.language === 'hi' 
            ? `\n\nमैंने आपके लिए कुछ उपयोगी वीडियो भी ढूंढे हैं जो आपकी मदद कर सकते हैं। नीचे दिए गए वीडियो देखें और कुछ देर आराम करें।`
            : session.language === 'mr'
            ? `\n\nमी तुमच्यासाठी काही उपयुक्त व्हिडिओ शोधले आहेत जे तुमची मदत करू शकतात. खाली दिलेले व्हिडिओ बघा आणि थोडा वेळ विश्रांती घ्या.`
            : `\n\nI've also found some helpful videos that might be useful for you. Take a look at the videos below and take a breather.`;
          
          enhancedResponse = aiResponse.text + videoMention;
        }
      } catch (error) {
        console.error('Error getting video suggestions:', error);
        // Continue without video suggestions if there's an error
      }
    }

    // Save AI message
    const assistantMessage = new Message({
      sessionId: session._id,
      role: 'assistant',
      contentText: enhancedResponse,
      contentAudioUrl: null, // TODO: Add TTS
      tokensIn: aiResponse.tokensIn,
      tokensOut: aiResponse.tokensOut,
      videoSuggestions: videoSuggestions,
    });
    await assistantMessage.save();

    // Update session message count
    session.messageCount = (session.messageCount || 0) + 2;
    await session.save();

    // Update user gamification stats - only message-related stats
    user.stats.totalMessages = (user.stats.totalMessages || 0) + 2; // +2 for user message + AI response
    
    await user.save();

    return NextResponse.json({
      message: {
        _id: assistantMessage._id,
        role: 'assistant',
        contentText: enhancedResponse,
        contentAudioUrl: null,
        createdAt: assistantMessage.createdAt,
        videoSuggestions: videoSuggestions,
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


