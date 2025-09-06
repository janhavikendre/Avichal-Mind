import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { AIService } from '@/services/ai';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const speechResult = formData.get('SpeechResult') as string;
    const confidence = formData.get('Confidence') as string;

    console.log('Voice webhook received:', {
      callSid,
      from,
      to,
      callStatus,
      speechResult,
      confidence
    });

    const twiml = new VoiceResponse();

    // Handle different call statuses
    if (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer') {
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Find or create user based on phone number
    const cleanedPhone = from.replace(/\D/g, '');
    let user = await User.findOne({ 
      clerkUserId: { $regex: `^phone_${cleanedPhone}_` } 
    });

    if (!user) {
      // Create user if not found
      const phoneUserId = `phone_${cleanedPhone}_${Date.now()}`;
      user = new User({
        clerkUserId: phoneUserId,
        email: `phone_${cleanedPhone}@avichal-mind.com`,
        firstName: 'Phone',
        lastName: 'User',
        points: 0,
        level: 1,
        streak: {
          current: 0,
          longest: 0,
          lastSessionDate: null
        },
        badges: [],
        achievements: [],
        stats: {
          totalSessions: 0,
          totalMessages: 0,
          totalDuration: 0,
          languagesUsed: [],
          modesUsed: [],
          firstSessionDate: null,
          lastSessionDate: null
        }
      });
      await user.save();
    }

    // Create or find session for this call
    let session = await Session.findOne({ 
      userId: user._id,
      startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    });

    if (!session) {
      session = new Session({
        userId: user._id,
        mode: 'voice',
        language: 'en', // Default to English for voice calls
        startedAt: new Date(),
        safetyFlags: {
          crisis: false,
          pii: false
        },
        messageCount: 0
      });
      await session.save();
    }

    // Handle speech input
    if (speechResult && parseFloat(confidence) > 0.5) {
      // Save user message
      const userMessage = new Message({
        sessionId: session._id,
        role: 'user',
        contentText: speechResult,
        createdAt: new Date()
      });
      await userMessage.save();

      // Generate AI response
      try {
        const aiResponse = await AIService.generateResponse(
          speechResult, 
          'en', 
          'Phone User',
          [] // No conversation history for voice calls
        );
        
        // Save AI message
        const aiMessage = new Message({
          sessionId: session._id,
          role: 'assistant',
          contentText: aiResponse.text,
          tokensIn: aiResponse.tokensIn,
          tokensOut: aiResponse.tokensOut,
          createdAt: new Date()
        });
        await aiMessage.save();

        // Update session
        session.messageCount += 2;
        await session.save();

        // Speak the AI response
        twiml.say({
          voice: 'alice',
          language: 'en-US'
        }, aiResponse.text);

        // Continue listening for more input
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 10,
          speechTimeout: 'auto',
          action: '/api/voice-webhook',
          method: 'POST',
          language: 'en-US'
        });

        gather.say({
          voice: 'alice',
          language: 'en-US'
        }, 'How else can I help you today?');

      } catch (aiError) {
        console.error('AI response error:', aiError);
        twiml.say({
          voice: 'alice',
          language: 'en-US'
        }, 'I apologize, but I encountered an error processing your request. Please try again.');

        // Continue listening
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 10,
          speechTimeout: 'auto',
          action: '/api/voice-webhook',
          method: 'POST',
          language: 'en-US'
        });

        gather.say({
          voice: 'alice',
          language: 'en-US'
        }, 'Please tell me how I can help you.');
      }

    } else if (callStatus === 'in-progress') {
      // Initial greeting
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Hello! This is Avichal Mind AI Wellness assistant. I\'m here to provide compassionate mental health support. How are you feeling today?');

      // Start listening for speech
      const gather = twiml.gather({
        input: ['speech'],
        timeout: 10,
        speechTimeout: 'auto',
        action: '/api/voice-webhook',
        method: 'POST',
        language: 'en-US'
      });

      gather.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Please tell me how I can help you today.');

      // If no speech is detected, provide options
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'I didn\'t hear anything. Please speak clearly about how you\'re feeling or what you\'d like to discuss.');

      // Give another chance
      const retryGather = twiml.gather({
        input: ['speech'],
        timeout: 10,
        speechTimeout: 'auto',
        action: '/api/voice-webhook',
        method: 'POST',
        language: 'en-US'
      });

      retryGather.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Please tell me how I can help you.');

      // Final fallback
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Thank you for calling Avichal Mind. If you need immediate help, please contact your local emergency services. Goodbye.');

    } else {
      // Handle other call statuses
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Thank you for calling Avichal Mind. Goodbye.');
    }

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Voice webhook error:', error);
    
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'I apologize, but I encountered a technical error. Please try calling again later. Goodbye.');

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

// Handle call status updates
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;

    console.log('Call status update:', {
      callSid,
      callStatus,
      callDuration
    });

    // Update session status
    const session = await Session.findOne({ 
      userId: { $exists: true },
      startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    if (session) {
      if (callStatus === 'completed') {
        session.completedAt = new Date();
        if (callDuration) {
          session.totalDuration = parseInt(callDuration);
        }
      }
      await session.save();

      // Update user stats
      const user = await User.findById(session.userId);
      if (user && callStatus === 'completed') {
        user.stats.totalSessions += 1;
        user.stats.lastSessionDate = new Date();
        if (!user.stats.firstSessionDate) {
          user.stats.firstSessionDate = new Date();
        }
        await user.save();
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Call status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update call status' },
      { status: 500 }
    );
  }
}
