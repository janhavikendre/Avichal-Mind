import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { User } from '@/models/user';
import { AIService } from '@/services/ai';
import { youtubeService } from '@/lib/youtube';
import { CrisisVideoService } from '@/lib/crisis-video-service';
import { gamificationService } from '@/lib/gamification';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { phoneUserId, content, isAudio = false } = body;

    console.log('Message API received:', { userId, phoneUserId, content, isAudio });
    console.log('Request body:', body);

    // Check if user is authenticated (either Clerk or phone user)
    if (!userId && !phoneUserId) {
      console.log('Unauthorized: No userId or phoneUserId');
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

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

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

    // Check for crisis content using enhanced detection
    const crisisDetection = await AIService.detectMentalBreakdown(content, conversationHistory);

    if (crisisDetection.isCrisis && crisisDetection.crisisType === 'suicidal') {
      // Update session with crisis flag for suicidal ideation
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
    
    // Get video suggestions based on response type
    let videoSuggestions: any[] = [];
    let enhancedResponse = aiResponse.text;
    
    console.log('AI Response shouldSuggestVideos:', aiResponse.shouldSuggestVideos);
    console.log('AI Response isCrisisResponse:', aiResponse.isCrisisResponse);
    console.log('AI Response crisisType:', aiResponse.crisisType);
    
    if (aiResponse.shouldSuggestVideos) {
      try {
        if (aiResponse.isCrisisResponse && aiResponse.crisisType && aiResponse.crisisType !== 'none') {
          // Get crisis-specific videos
          const crisisVideoResponse = await CrisisVideoService.getCrisisVideos(
            aiResponse.crisisType as 'suicidal' | 'mental_breakdown' | 'panic_attack' | 'severe_distress',
            session.language,
            3
          );
          
          videoSuggestions = crisisVideoResponse.videos;
          console.log('Crisis videos found:', videoSuggestions.length);
          
          // Add crisis support message
          if (videoSuggestions.length > 0) {
            const crisisVideoMention = session.language === 'hi' 
              ? `\n\nमैंने आपके लिए तत्काल सहायता के लिए कुछ विशेष वीडियो ढूंढे हैं। कृपया इन वीडियो को देखें और तुरंत समर्थन लें।`
              : session.language === 'mr'
              ? `\n\nमी तुमच्यासाठी त्वरित सहाय्यासाठी काही विशेष व्हिडिओ शोधले आहेत. कृपया हे व्हिडिओ बघा आणि त्वरित समर्थन घ्या.`
              : `\n\nI've found some special videos for immediate support. Please watch these videos and reach out for immediate help.`;
            
            enhancedResponse = aiResponse.text + crisisVideoMention;
          }
        } else {
          // Get regular wellness videos
          const conversationContext = `${content} ${aiResponse.text}`;
          console.log('Getting regular videos for context:', conversationContext);
          videoSuggestions = await youtubeService.getRelevantVideos(conversationContext, session.language);
          console.log('Regular videos found:', videoSuggestions.length);
          
          // Enhance AI response to naturally mention the videos
          if (videoSuggestions.length > 0) {
            const videoMention = session.language === 'hi' 
              ? `\n\nमैंने आपके लिए कुछ उपयोगी वीडियो भी ढूंढे हैं जो आपकी मदद कर सकते हैं। नीचे दिए गए वीडियो देखें और कुछ देर आराम करें।`
              : session.language === 'mr'
              ? `\n\nमी तुमच्यासाठी काही उपयुक्त व्हिडिओ शोधले आहेत जे तुमची मदत करू शकतात. खाली दिलेले व्हिडिओ बघा आणि थोडा वेळ विश्रांती घ्या.`
              : `\n\nI've also found some helpful videos that might be useful for you. Take a look at the videos below and take a breather.`;
            
            enhancedResponse = aiResponse.text + videoMention;
          }
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
      isCrisisResponse: aiResponse.isCrisisResponse,
      crisisType: aiResponse.crisisType,
      crisisSeverity: aiResponse.crisisSeverity,
    });
    await assistantMessage.save();

    // Update session message count
    session.messageCount = (session.messageCount || 0) + 2;
    await session.save();

    // Update user gamification stats - only message-related stats
    user.stats.totalMessages = (user.stats.totalMessages || 0) + 2; // +2 for user message + AI response
    user.stats.lastSessionDate = new Date();
    
    await user.save();

    // Fixed: Generate realtime summary after every few messages
    const shouldGenerateRealtimeSummary = session.messageCount >= 6 && session.messageCount % 4 === 0; // Every 4 messages after 6 messages
    
    if (shouldGenerateRealtimeSummary) {
      try {
        console.log(`Generating realtime summary for session ${session._id} (${session.messageCount} messages)`);
        
        // Import SummaryService dynamically to avoid circular dependencies
        const { SummaryService } = await import('@/services/summary');
        const summaryResult = await SummaryService.generateSessionSummary(session._id.toString());
        
        if (summaryResult.success && !summaryResult.skipped) {
          console.log(`Realtime summary generated for session ${session._id}:`, {
            summaryLength: summaryResult.summary?.content.length,
            language: summaryResult.summary?.language,
            qualityScore: summaryResult.summary?.quality.score
          });
        } else if (summaryResult.skipped) {
          console.log(`Realtime summary skipped for session ${session._id}: ${summaryResult.message}`);
        } else {
          console.error(`Realtime summary generation failed for session ${session._id}: ${summaryResult.message}`);
        }
      } catch (error) {
        console.error('Error generating realtime summary:', error);
        // Don't fail the message if summary generation fails
      }
    }

    return NextResponse.json({
      message: {
        _id: assistantMessage._id,
        role: 'assistant',
        contentText: enhancedResponse,
        contentAudioUrl: null,
        createdAt: assistantMessage.createdAt,
        videoSuggestions: videoSuggestions,
        isCrisisResponse: aiResponse.isCrisisResponse,
        crisisType: aiResponse.crisisType,
        crisisSeverity: aiResponse.crisisSeverity,
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


