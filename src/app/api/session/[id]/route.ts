import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { maskPII } from '@/lib/utils';
import { gamificationService } from '@/lib/gamification';
import { AIService } from '@/services/ai';

export async function GET(
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

    const session = await Session.findOne({
      _id: params.id,
      userId: user._id,
    }).populate('userId', 'name email');

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get messages for this session
    const messages = await Message.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .select('-__v');

    // Mask PII in messages if flagged
    const processedMessages = session.safetyFlags.pii 
      ? messages.map(msg => ({
          ...msg.toObject(),
          contentText: maskPII(msg.contentText),
        }))
      : messages;

    return NextResponse.json({
      session: {
        id: session._id,
        mode: session.mode,
        language: session.language,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        summary: session.summary,
        safetyFlags: session.safetyFlags,
        messageCount: session.messageCount,
        totalDuration: session.totalDuration,
        user: session.userId,
      },
      messages: processedMessages,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const session = await Session.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'finalize') {
      // Get all messages to generate summary
      const messages = await Message.find({ sessionId: session._id })
        .sort({ createdAt: 1 });

      // Generate summary using AI service with proper language detection
      const summary = await AIService.generateSessionSummary(messages, session.language);

      session.completedAt = new Date();
      session.summary = summary;
      session.totalDuration = Math.floor(
        (session.completedAt.getTime() - session.startedAt.getTime()) / 1000
      );

      await session.save();

      // Update user gamification stats for completed session
      user.stats.totalSessions = (user.stats.totalSessions || 0) + 1;
      user.stats.totalDuration = (user.stats.totalDuration || 0) + session.totalDuration;
      
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
      const sessionDate = new Date();
      const newStreak = gamificationService.updateStreak(user, sessionDate);
      console.log('Streak update:', {
        userId: user.clerkUserId,
        oldStreak: user.streak.current,
        newStreak: newStreak.current,
        lastSessionDate: user.streak.lastSessionDate,
        sessionDate: sessionDate
      });
      user.streak.current = newStreak.current;
      user.streak.longest = newStreak.longest;
      user.streak.lastSessionDate = sessionDate;
      
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
        const existingAchievement = user.achievements.find((a: any) => a.id === achievement.id);
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
        message: 'Session finalized successfully',
        summary: session.summary,
        completedAt: session.completedAt,
        totalDuration: session.totalDuration,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error finalizing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Find the session and verify ownership
    const session = await Session.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log(`🗑️ Deleting session ${params.id} for user ${user._id}`);

    // Delete all messages associated with this session
    const deletedMessages = await Message.deleteMany({ sessionId: session._id });
    console.log(`🗑️ Deleted ${deletedMessages.deletedCount} messages for session ${params.id}`);

    // Delete the session
    await Session.findByIdAndDelete(params.id);
    console.log(`🗑️ Session ${params.id} deleted successfully`);

    return NextResponse.json({
      message: 'Session deleted successfully',
      deletedSessionId: params.id,
      deletedMessagesCount: deletedMessages.deletedCount
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


