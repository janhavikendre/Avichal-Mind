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
    console.log('🎯 Voice webhook called - Environment:', process.env.NODE_ENV);
    console.log('🎯 Voice webhook called - URL:', request.url);
    console.log('🎯 Voice webhook called - Method:', request.method);
    
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const speechResult = formData.get('SpeechResult') as string;
    const confidence = formData.get('Confidence') as string;

    console.log('🎯 Voice webhook received:', {
      callSid,
      from,
      to,
      callStatus,
      speechResult,
      confidence,
      environment: process.env.NODE_ENV
    });
    
    // Debug speech detection
    console.log('🔍 Speech detection debug:', {
      hasSpeechResult: !!speechResult,
      speechResultValue: speechResult,
      speechResultType: typeof speechResult,
      speechResultLength: speechResult?.length,
      confidenceValue: confidence,
      confidenceType: typeof confidence,
      confidenceParsed: parseFloat(confidence || '0')
    });

    const twiml = new VoiceResponse();

    // Handle different call statuses
    if (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer') {
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // INSTANT GREETING for in-progress calls - ABSOLUTELY NO DELAYS!
    console.log('🔍 Greeting condition check:', {
      callStatus,
      speechResult,
      isInProgress: callStatus === 'in-progress',
      hasNoSpeech: !speechResult,
      shouldGreet: callStatus === 'in-progress' && !speechResult
    });
    
    if (callStatus === 'in-progress' && !speechResult) {
      console.log('🎤 INSTANT GREETING - Zero delays!');
      
      // Ultra-fast greeting with optimized TwiML
      const greeting = `Hello! This is Avichal Mind AI Wellness assistant. I'm here to provide compassionate mental health support. How are you feeling today?`;
      
      // First, greet the user
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, greeting);

      // Then start listening for their response (PROPER TwiML STRUCTURE)
      const gather = twiml.gather({
        input: ['speech'],
        timeout: 15,
        speechTimeout: 'auto',
        action: '/api/voice-webhook',
        method: 'POST',
        language: 'en-US',
        enhanced: true,
        profanityFilter: false
      });

      // Prompt inside gather (this will only play if they don't speak)
      gather.say({
        voice: 'alice',
        language: 'en-US'
      }, 'I\'m listening. Please tell me how you\'re feeling or what you\'d like to discuss. You can speak in English, Hindi, or Marathi.');

      // Fallback if no speech is detected after gather timeout
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Thank you for calling Avichal Mind. Please call back when you\'re ready to talk. Take care!');
      twiml.hangup();

      // Return immediately with optimized headers
      const twimlResponse = twiml.toString();
      console.log('🎯 Returning TwiML for in-progress call:', twimlResponse);
      
      return new NextResponse(twimlResponse, {
        headers: { 
          'Content-Type': 'text/xml',
          'Cache-Control': 'no-cache',
          'Connection': 'close'
        }
      });
    }

    // If we have speech input, we need to process it
    if (speechResult) {
      console.log('🎤 Speech detected, processing...');
      // Continue to speech processing below
    } else {
      // No speech and not initial greeting - this shouldn't happen but handle gracefully
      console.log('⚠️ No speech detected and not initial greeting - ending call');
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Thank you for calling Avichal Mind. Goodbye.');
      twiml.hangup();
      
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Only connect to database when we need to process speech
    await connectDB();

    // Find or create user based on phone number (only for speech processing)
    const cleanedPhone = from.replace(/\D/g, '');
    let formattedPhone;
    
    // Format phone number consistently with call API
    if (cleanedPhone.startsWith('91')) {
      formattedPhone = `+${cleanedPhone}`;
    } else if (cleanedPhone.startsWith('1') && cleanedPhone.length === 11) {
      formattedPhone = `+${cleanedPhone}`;
    } else if (cleanedPhone.length === 10) {
      if (cleanedPhone.match(/^[6-9]/)) {
        formattedPhone = `+91${cleanedPhone}`;
      } else {
        formattedPhone = `+1${cleanedPhone}`;
      }
    } else {
      formattedPhone = `+91${cleanedPhone}`;
    }

    console.log('🔍 Looking for user with phone:', formattedPhone);
    
    let user = await User.findOne({ 
      phoneNumber: formattedPhone,
      userType: 'phone'
    });

    if (!user) {
      console.log('🔍 User not found, creating new phone user');
      // Create user if not found
      user = new User({
        clerkUserId: undefined, // Don't set clerkUserId for phone users
        email: `phone_${cleanedPhone}@avichal-mind.com`,
        firstName: 'Phone',
        lastName: 'User',
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
      console.log('✅ Created new phone user:', user._id);
    } else {
      console.log('✅ Found existing phone user:', user._id);
    }

    // Create or find session for this call
    let session = await Session.findOne({ 
      callSid: callSid
    });

    if (!session) {
      console.log('🔍 Session not found for callSid:', callSid, 'creating new session');
      session = new Session({
        userId: user._id,
        mode: 'voice',
        language: 'en', // Default to English for voice calls
        startedAt: new Date(),
        safetyFlags: {
          crisis: false,
          pii: false
        },
        messageCount: 0,
        callSid: callSid,
        phoneNumber: formattedPhone
      });
      await session.save();
      console.log('✅ Created new session:', session._id);
    } else {
      console.log('✅ Found existing session:', session._id);
    }

    // Handle speech input - only process if we have speech
    console.log('🎤 Speech processing check:', {
      speechResult,
      confidence,
      hasSpeech: !!speechResult,
      confidenceValue: parseFloat(confidence),
      meetsThreshold: speechResult && parseFloat(confidence) > 0.5
    });
    
    if (speechResult && parseFloat(confidence) > 0.5) {
      console.log('✅ Processing speech input:', speechResult);
      // Save user message
      const userMessage = new Message({
        sessionId: session._id,
        role: 'user',
        contentText: speechResult,
        createdAt: new Date()
      });
      await userMessage.save();

      // Detect language from user input
      const detectedLanguage = detectLanguageFromSpeech(speechResult);
      console.log('🌐 Detected language:', detectedLanguage);

      // Update session language if changed
      if (detectedLanguage !== session.language) {
        session.language = detectedLanguage;
        await session.save();
        console.log('🔄 Updated session language to:', detectedLanguage);
        
        // Provide language switch confirmation
        const languageConfirmation = getLanguageConfirmation(detectedLanguage);
        if (languageConfirmation) {
          const voiceConfig = getVoiceConfig(detectedLanguage);
          twiml.say({
            voice: voiceConfig.voice,
            language: voiceConfig.language
          }, languageConfirmation);
        }
      }

      // Generate AI response
      try {
        const userName = user.firstName || 'there';
        console.log('🤖 Generating AI response for:', speechResult, 'in language:', detectedLanguage);
        
        const aiResponse = await AIService.generateResponse(
          speechResult, 
          detectedLanguage, 
          userName,
          [] // No conversation history for voice calls
        );
        
        console.log('✅ AI response generated:', aiResponse.text);
        
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

        // Determine voice and language for TTS
        const voiceConfig = getVoiceConfig(detectedLanguage);
        
        // Speak the AI response with appropriate voice
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, aiResponse.text);

        // Continue listening for more input - PROPER STRUCTURE
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 15,
          speechTimeout: 'auto',
          action: '/api/voice-webhook',
          method: 'POST',
          language: voiceConfig.language,
          enhanced: true,
          profanityFilter: false
        });

        // This will only play if user doesn't speak within the timeout
        const followUpQuestion = getFollowUpQuestion(detectedLanguage);
        gather.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, followUpQuestion);

        // Final fallback if still no response
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, detectedLanguage === 'hi' 
          ? 'धन्यवाद। फिर मिलते हैं।' 
          : detectedLanguage === 'mr'
          ? 'धन्यवाद। पुन्हा भेटूया।'
          : 'Thank you for calling. Take care.');
        twiml.hangup();

      } catch (aiError) {
        console.error('❌ AI response error:', aiError);
        console.error('❌ AI error details:', {
          message: aiError instanceof Error ? aiError.message : 'Unknown AI error',
          stack: aiError instanceof Error ? aiError.stack : undefined
        });
        
        // Provide a helpful fallback response in detected language
        const detectedLanguage = detectLanguageFromSpeech(speechResult);
        const voiceConfig = getVoiceConfig(detectedLanguage);
        const fallbackResponse = getFallbackResponse(detectedLanguage);
        
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, fallbackResponse);

        // Continue listening with proper structure
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 15,
          speechTimeout: 'auto',
          action: '/api/voice-webhook',
          method: 'POST',
          language: voiceConfig.language,
          enhanced: true,
          profanityFilter: false
        });

        const followUpQuestion = getFollowUpQuestion(detectedLanguage);
        gather.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, followUpQuestion);

        // Final fallback
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, detectedLanguage === 'hi' 
          ? 'धन्यवाद। फिर मिलते हैं।' 
          : detectedLanguage === 'mr'
          ? 'धन्यवाद। पुन्हा भेटूया।'
          : 'Thank you for calling. Take care.');
        twiml.hangup();
      }

    } else {
      // No speech detected or confidence too low -> gently reprompt and keep listening
      console.log('⚠️ No/low-confidence speech detected. Reprompting and continuing to listen.');
      const sessionLanguage = session?.language || 'en';
      const retryVoice = getVoiceConfig(sessionLanguage);

      twiml.say({ voice: retryVoice.voice, language: retryVoice.language },
        sessionLanguage === 'hi'
          ? 'माफ़ कीजिए, मुझे स्पष्ट रूप से सुनाई नहीं दिया। कृपया फिर से बोलें।'
          : sessionLanguage === 'mr'
          ? 'माफ करा, मला स्पष्टपणे ऐकू आले नाही. कृपया पुन्हा बोला.'
          : "I'm sorry, I didn't catch that. Please speak again.");

      const repromptGather = twiml.gather({
        input: ['speech'],
        timeout: 15,
        speechTimeout: 'auto',
        action: '/api/voice-webhook',
        method: 'POST',
        language: retryVoice.language,
        enhanced: true,
        profanityFilter: false
      });

      // Prompt inside gather for better flow
      repromptGather.say({ voice: retryVoice.voice, language: retryVoice.language },
        sessionLanguage === 'hi'
          ? 'मैं सुन रहा हूँ।'
          : sessionLanguage === 'mr'
          ? 'मी ऐकत आहे.'
          : "I'm listening.");

      // Final fallback if no response
      twiml.say({ voice: retryVoice.voice, language: retryVoice.language },
        sessionLanguage === 'hi'
          ? 'धन्यवाद। फिर मिलते हैं।'
          : sessionLanguage === 'mr'
          ? 'धन्यवाद। पुन्हा भेटूया।'
          : 'Thank you for calling. Take care.');
      twiml.hangup();

      const repromptResponse = twiml.toString();
      console.log('🎯 Returning reprompt TwiML (no speech):', repromptResponse);
      return new NextResponse(repromptResponse, { headers: { 'Content-Type': 'text/xml' } });
    }

    const finalTwimlResponse = twiml.toString();
    console.log('🎯 Returning final TwiML response:', finalTwimlResponse);
    
    return new NextResponse(finalTwimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('❌ Voice webhook error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const twiml = new VoiceResponse();
    
    // Provide a more helpful error message
    const errorMessage = "I'm experiencing some technical difficulties right now. Please try calling back in a few minutes, or you can visit our website for immediate support. Thank you for your patience.";
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, errorMessage);

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

// Helper function to detect language from speech
function detectLanguageFromSpeech(speechText: string): 'en' | 'hi' | 'mr' {
  const lowerText = speechText.toLowerCase();
  
  // Check for Hindi/Marathi characters
  const hasDevanagari = /[\u0900-\u097F]/.test(speechText);
  
  if (hasDevanagari) {
    // Check for Marathi-specific words
    const marathiWords = ['काय', 'कसे', 'कधी', 'कुठे', 'कोण', 'मी', 'तुम्ही', 'आहात', 'आहे', 'आहेत', 
                         'कशी', 'कशा', 'कशीत', 'कशीतही', 'कशीतरी', 'कशीतरीही', 'कशीतरीहीत',
                         'तुमची', 'तुमचे', 'तुमच्या', 'तुमचं', 'तुमचा', 'तुमचीत', 'तुमच्यात',
                         'माझी', 'माझे', 'माझ्या', 'माझं', 'माझा', 'माझीत', 'माझ्यात',
                         'आमची', 'आमचे', 'आमच्या', 'आमचं', 'आमचा', 'आमचीत', 'आमच्यात'];
    const hasMarathiWords = marathiWords.some(word => lowerText.includes(word));
    
    if (hasMarathiWords) {
      console.log('🌐 Language detected: Marathi (based on Marathi-specific words)');
      return 'mr';
    } else {
      console.log('🌐 Language detected: Hindi (based on Devanagari characters)');
      return 'hi';
    }
  }
  
  // Check for language switching requests
  if (lowerText.includes('marathi') || lowerText.includes('मराठी') || lowerText.includes('marathi mein') || 
      lowerText.includes('marathi me') || lowerText.includes('marathi language') || 
      lowerText.includes('मराठीत') || lowerText.includes('मराठी मध्ये')) {
    console.log('🌐 Language switch requested: Marathi');
    return 'mr';
  }
  
  if (lowerText.includes('hindi') || lowerText.includes('हिंदी') || lowerText.includes('hindi mein') ||
      lowerText.includes('hindi me') || lowerText.includes('hindi language') ||
      lowerText.includes('हिंदी में') || lowerText.includes('हिंदीत')) {
    console.log('🌐 Language switch requested: Hindi');
    return 'hi';
  }
  
  if (lowerText.includes('english') || lowerText.includes('अंग्रेजी') || lowerText.includes('english mein') ||
      lowerText.includes('english me') || lowerText.includes('english language') ||
      lowerText.includes('अंग्रेजी में') || lowerText.includes('अंग्रेजीत')) {
    console.log('🌐 Language switch requested: English');
    return 'en';
  }
  
  // Default to English
  console.log('🌐 Language detected: English (default)');
  return 'en';
}

// Helper function to get voice configuration for different languages
function getVoiceConfig(language: 'en' | 'hi' | 'mr'): { voice: 'alice'; language: 'en-US' | 'hi-IN' } {
  switch (language) {
    case 'hi':
      return { voice: 'alice', language: 'hi-IN' };
    case 'mr':
      // For Marathi, we'll use English voice but the AI will generate Marathi text
      // Twilio will attempt to pronounce the Marathi text with English voice
      return { voice: 'alice', language: 'en-US' };
    default:
      return { voice: 'alice', language: 'en-US' };
  }
}

// Helper function to get follow-up questions in different languages
function getFollowUpQuestion(language: 'en' | 'hi' | 'mr'): string {
  switch (language) {
    case 'hi':
      return 'और कैसे मैं आपकी मदद कर सकता हूं?';
    case 'mr':
      return 'आणखी कशी मी तुमची मदत करू शकतो?';
    default:
      return 'How else can I help you today?';
  }
}

// Helper function to get fallback responses in different languages
function getFallbackResponse(language: 'en' | 'hi' | 'mr'): string {
  switch (language) {
    case 'hi':
      return 'मैं आपकी सहायता के लिए यहाँ हूं। आइए कुछ साँस लेने की तकनीकों से शुरू करते हैं। 4 सेकंड तक गहरी साँस लें, 4 सेकंड रोकें, और 4 सेकंड तक छोड़ें। यह आपको शांत और केंद्रित महसूस करने में मदद करेगा।';
    case 'mr':
      return 'मी तुमची मदत करण्यासाठी येथे आहे. काही श्वास तंत्रांसह सुरुवात करूया. 4 सेकंद खोल श्वास घ्या, 4 सेकंद धरा, आणि 4 सेकंद सोडा. हे तुम्हाला शांत आणि केंद्रित वाटण्यास मदत करेल.';
    default:
      return "I'm here to support you. Let me help you with some breathing techniques. Take a deep breath in for 4 seconds, hold for 4 seconds, and exhale for 4 seconds. This will help you feel more calm and centered.";
  }
}

// Helper function to get language switch confirmation messages
function getLanguageConfirmation(language: 'en' | 'hi' | 'mr'): string | null {
  switch (language) {
    case 'hi':
      return 'ठीक है, अब मैं हिंदी में बात करूंगा। आप कैसे हैं?';
    case 'mr':
      return 'ठीक आहे, आता मी मराठीत बोलेन. तुम्हाला कसे वाटत आहे?';
    default:
      return 'Okay, I will now speak in English. How are you feeling?';
  }
}
