import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';
import { Session } from '@/models/session';
import { auth } from '@clerk/nextjs/server';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Call API: Starting request processing');
    
    // Try to connect to database with retry logic
    try {
      await connectDB();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please try again in a few moments.',
          details: 'The database is temporarily unavailable. Please check your internet connection and try again.'
        },
        { status: 503 }
      );
    }

    const { phoneNumber, userName } = await request.json();
    console.log('🔍 Call API: Received data:', { phoneNumber: phoneNumber ? '***' + phoneNumber.slice(-4) : 'none', userName: userName || 'none' });

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Format phone number for Twilio (handle Indian numbers properly)
    let formattedPhone;
    if (cleanedPhone.startsWith('91')) {
      // Indian number (already has country code)
      formattedPhone = `+${cleanedPhone}`;
    } else if (cleanedPhone.startsWith('1') && cleanedPhone.length === 11) {
      // US number (already has country code)
      formattedPhone = `+${cleanedPhone}`;
    } else if (cleanedPhone.length === 10) {
      // 10-digit number - assume Indian if it starts with 6-9, US if it starts with 2-5
      if (cleanedPhone.match(/^[6-9]/)) {
        // Indian mobile number
        formattedPhone = `+91${cleanedPhone}`;
      } else {
        // US number
        formattedPhone = `+1${cleanedPhone}`;
      }
    } else {
      // Default to Indian format for other cases
      formattedPhone = `+91${cleanedPhone}`;
    }

    // Check if user exists in Clerk (if authenticated)
    const { userId } = await auth();
    let user = null;

    if (userId) {
      // User is authenticated, find existing user
      user = await User.findOne({ clerkUserId: userId });
    } else {
      // Create a temporary user for phone-only access
      // Check if phone user already exists by phone number
      user = await User.findOne({ 
        phoneNumber: formattedPhone,
        userType: 'phone'
      });

      if (!user) {
        // Create new user for phone access
        const nameParts = userName ? userName.trim().split(' ') : ['Phone', 'User'];
        const firstName = nameParts[0] || 'Phone';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        user = new User({
          clerkUserId: undefined, // Don't set clerkUserId for phone users
          email: `phone_${cleanedPhone}@avichal-mind.com`,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: formattedPhone,
          userType: 'phone',
          points: 0,
          level: 1,
          streak: 0,
          badges: [],
          achievements: [],
          stats: {
            totalSessions: 0,
            totalMessages: 0,
            totalMinutes: 0,
            crisisSessions: 0
          }
        });
        await user.save();
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create or find user' },
        { status: 500 }
      );
    }

    // Get the webhook URL for TwiML
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/voice-webhook`;
    
    console.log('🎯 Call API - Environment:', process.env.NODE_ENV);
    console.log('🎯 Call API - Base URL:', baseUrl);
    console.log('🎯 Call API - Webhook URL:', webhookUrl);

    // Make the outbound call
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhoneNumber) {
      return NextResponse.json(
        { error: 'Twilio phone number not configured' },
        { status: 500 }
      );
    }

    let call;
    try {
      call = await client.calls.create({
        to: formattedPhone,
        from: twilioPhoneNumber,
        url: webhookUrl,
        method: 'POST',
        statusCallback: `${baseUrl}/api/voice-webhook/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      });
    } catch (callError: any) {
      console.error('Error initiating call:', callError);

      // Check if it's a verification error (trial account limitation)
      if (callError.code === 21219) {
        console.log('✅ Phone number not verified. Creating session without call for trial account.');

        // Create a mock call SID for trial accounts
        const mockCallSid = `TRIAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create session without actual call
        const session = new Session({
          userId: user._id,
          mode: 'voice',
          language: 'en',
          startedAt: new Date(),
          safetyFlags: {
            crisis: false,
            pii: false
          },
          messageCount: 0,
          callSid: mockCallSid,
          phoneNumber: formattedPhone
        });
        await session.save();

        console.log('✅ Trial account session created successfully:', {
          sessionId: session._id,
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`
        });

        const redirectUrl = user.userType === 'phone' ? `/session/${session._id}/continue` : '/dashboard';
        console.log('🎯 Call API (Trial): User type:', user.userType);
        console.log('🎯 Call API (Trial): Redirect URL:', redirectUrl);
        console.log('🎯 Call API (Trial): Session ID:', session._id);

        return NextResponse.json({
          success: true,
          callSid: mockCallSid,
          sessionId: session._id,
          message: 'Welcome! Your account has been created successfully.',
          userId: user._id,
          userType: user.userType,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            userType: user.userType
          },
          redirectUrl: redirectUrl,
          warning: 'Note: For trial accounts, phone calls require number verification. You can still use the chat interface for AI support!'
        });
      } else {
        // Re-throw other call errors
        throw callError;
      }
    }

    // Create a new voice session for this call
    const session = new Session({
      userId: user._id,
      mode: 'voice',
      language: 'en', // Default to English for voice calls
      startedAt: new Date(),
      safetyFlags: {
        crisis: false,
        pii: false
      },
      messageCount: 0,
      callSid: call.sid, // Store Twilio call SID for reference
      phoneNumber: formattedPhone // Store the phone number used
    });
    await session.save();

    console.log('Call initiated:', {
      callSid: call.sid,
      to: formattedPhone,
      from: twilioPhoneNumber,
      userId: user._id,
      sessionId: session._id,
      userType: user.userType
    });

    const redirectUrl = user.userType === 'phone' ? `/session/${session._id}/continue` : '/dashboard';
    console.log('🎯 Call API: User type:', user.userType);
    console.log('🎯 Call API: Redirect URL:', redirectUrl);
    console.log('🎯 Call API: Session ID:', session._id);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      sessionId: session._id,
      message: 'Call initiated successfully',
      userId: user._id,
      userType: user.userType,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        userType: user.userType
      },
      redirectUrl: redirectUrl
    });

  } catch (error) {
    console.error('❌ Call API Error:', error);
    
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Handle Twilio-specific errors
      if (error.message.includes('Invalid phone number')) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('unverified')) {
        return NextResponse.json(
          { error: 'This phone number needs to be verified in Twilio. Please verify your number in the Twilio Console or use a verified number for testing.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Permission denied')) {
        return NextResponse.json(
          { error: 'Call permission denied. Please check your Twilio configuration.' },
          { status: 403 }
        );
      }
    }

    console.error('❌ Returning generic error response');
    return NextResponse.json(
      { error: 'Failed to initiate call. Please try again.' },
      { status: 500 }
    );
  }
}
