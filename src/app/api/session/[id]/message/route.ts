import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { geminiService } from '@/lib/gemini';
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
    
    // Get relevant video suggestions only for specific emotional/mental health topics
    let videoSuggestions: any[] = [];
    let enhancedResponse = aiResponse;
    
    try {
      // Check if the conversation is about specific emotional/mental health topics
      const emotionalKeywords = [
        'stress', 'stressed', 'anxiety', 'depression', 'sad', 'lonely', 'bored', 'boredom',
        'angry', 'frustrated', 'overwhelmed', 'tired', 'exhausted', 'worried', 'fear',
        'panic', 'mood', 'emotion', 'feeling', 'mental health', 'therapy', 'counseling',
        'meditation', 'relaxation', 'breathing', 'sleep', 'insomnia', 'grief', 'loss',
        'relationship', 'family', 'work stress', 'burnout', 'self-care', 'wellness'
      ];
      
      const hasEmotionalContent = emotionalKeywords.some(keyword => 
        content.toLowerCase().includes(keyword) || aiResponse.toLowerCase().includes(keyword)
      );
      
      // Only show videos for emotional/mental health topics
      if (hasEmotionalContent) {
        // Create conversation context for video search
        const conversationContext = `${content} ${aiResponse}`;
        videoSuggestions = await youtubeService.getRelevantVideos(conversationContext, session.language);
        
        // Enhance AI response to naturally mention the videos
        if (videoSuggestions.length > 0) {
          const videoMention = session.language === 'hi' 
            ? `\n\nमैंने आपके लिए कुछ उपयोगी वीडियो भी ढूंढे हैं जो आपकी मदद कर सकते हैं। नीचे दिए गए वीडियो देखें और कुछ देर आराम करें।`
            : session.language === 'mr'
            ? `\n\nमी तुमच्यासाठी काही उपयुक्त व्हिडिओ शोधले आहेत जे तुमची मदत करू शकतात. खाली दिलेले व्हिडिओ बघा आणि थोडा वेळ विश्रांती घ्या.`
            : `\n\nI've also found some helpful videos that might be useful for you. Take a look at the videos below and take a breather.`;
          
          enhancedResponse = aiResponse + videoMention;
        }
      }
    } catch (error) {
      console.error('Error getting video suggestions:', error);
      // Continue without video suggestions if there's an error
    }

    // Save AI message
    const assistantMessage = new Message({
      sessionId: session._id,
      role: 'assistant',
      contentText: enhancedResponse,
      contentAudioUrl: null, // TODO: Add TTS
      tokensIn: 0,
      tokensOut: enhancedResponse.length,
      videoSuggestions: videoSuggestions,
    });
    await assistantMessage.save();

    // Update session message count
    session.messageCount = (session.messageCount || 0) + 2;
    await session.save();

    // Update user gamification stats
    // Update user stats
    user.stats.totalSessions = (user.stats.totalSessions || 0) + 1;
    user.stats.totalMessages = (user.stats.totalMessages || 0) + session.messageCount;
    
    // Update languages and modes used
    if (!user.stats.languagesUsed.includes(session.language)) {
      user.stats.languagesUsed.push(session.language);
    }
    if (!user.stats.modesUsed.includes(session.mode)) {
      user.stats.modesUsed.push(session.mode);
    }
    
    // Update first and last session dates
    if (!user.stats.firstSessionDate) {
      user.stats.firstSessionDate = new Date();
    }
    user.stats.lastSessionDate = new Date();
    
    // Update streak
    const newStreak = gamificationService.updateStreak(user, new Date());
    user.streak.current = newStreak.current;
    user.streak.longest = newStreak.longest;
    user.streak.lastSessionDate = new Date();
    
    // Award points
    const pointsEarned = gamificationService.awardSessionPoints(session);
    user.points = (user.points || 0) + pointsEarned;
    user.level = gamificationService.calculateLevel(user.points);
    
    // Check for new badges
    const newBadges = gamificationService.checkBadges(user);
    for (const badge of newBadges) {
      user.badges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlockedAt: new Date(),
        category: badge.category as any
      });
    }
    
    // Check for new achievements
    const newAchievements = gamificationService.checkAchievements(user);
    for (const achievement of newAchievements) {
      const existingAchievement = user.achievements.find(a => a.id === achievement.id);
      if (existingAchievement) {
        existingAchievement.progress = achievement.progress;
        if (achievement.completed && !existingAchievement.completed) {
          existingAchievement.completed = true;
          existingAchievement.completedAt = new Date();
        }
      } else {
        user.achievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          progress: achievement.progress,
          target: achievement.target,
          completed: achievement.completed,
          completedAt: achievement.completed ? new Date() : undefined,
          category: achievement.category as any
        });
      }
    }
    
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


