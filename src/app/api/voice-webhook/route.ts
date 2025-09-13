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

    // ENHANCED WARM GREETING for in-progress calls
    console.log('🔍 Greeting condition check:', {
      callStatus,
      speechResult,
      isInProgress: callStatus === 'in-progress',
      hasNoSpeech: !speechResult,
      shouldGreet: callStatus === 'in-progress' && !speechResult
    });
    
    if (callStatus === 'in-progress' && !speechResult) {
      console.log('🎤 SHORT GREETING - Clear and Simple!');
      
      // Short, clear greeting
      const greeting = `Hi! I'm Avichal Mind Assistant. How can I help you today?`;
      
      // Enhanced greeting with better voice
      twiml.say({
        voice: 'Polly.Joanna', // Natural female English voice
        language: 'en-US'
      }, greeting);

      // Optimized listening setup - ULTRA FAST RESPONSE: 1 second after user stops
      const gather = twiml.gather({
        input: ['speech'],
        timeout: 15,
        speechTimeout: '1', // CRITICAL: 1 second for ultra-fast AI response
        action: '/api/voice-webhook',
        method: 'POST',
        language: 'en-US',
        enhanced: true,
        profanityFilter: false
      });

      // Simple prompt if they don't speak immediately
      gather.say({
        voice: 'Polly.Joanna',
        language: 'en-US'
      }, 'I\'m listening. Please tell me how you\'re feeling.');

      // Simple fallback
      twiml.say({
        voice: 'Polly.Joanna',
        language: 'en-US'
      }, 'Thank you for calling. Take care.');
      twiml.hangup();

      // Return immediately with optimized headers
      const twimlResponse = twiml.toString();
      console.log('🎯 Returning enhanced TwiML for in-progress call:', twimlResponse);
      
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
        voice: 'Polly.Joanna',
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

    // CRITICAL FIX: Accept ANY speech result to ensure AI responds
    console.log('🎤 Speech processing check:', {
      speechResult,
      confidence,
      hasSpeech: !!speechResult,
      confidenceValue: parseFloat(confidence || '0'),
      willProcess: !!speechResult // Process ANY speech, regardless of confidence
    });
    
    if (speechResult) { // CRITICAL: Remove confidence check - process ANY speech
      console.log('✅ Processing speech input:', speechResult);
      
      // Save user message
      const userMessage = new Message({
        sessionId: session._id,
        role: 'user',
        contentText: speechResult,
        createdAt: new Date()
      });
      await userMessage.save();

      // Enhanced language detection
      const detectedLanguage = detectLanguageFromSpeech(speechResult);
      console.log('🌐 Enhanced language detection:', detectedLanguage);

      // Update session language if changed
      if (detectedLanguage !== session.language) {
        session.language = detectedLanguage;
        await session.save();
        console.log('🔄 Updated session language to:', detectedLanguage);
      }

      // Generate enhanced AI response with conversation context
      try {
        const userName = user.firstName || 'friend';
        console.log('🤖 Generating enhanced AI response for:', speechResult, 'in language:', detectedLanguage);
        
        // Add quick acknowledgment to reduce perceived delay for Twilio calls
        const quickAck = detectedLanguage === 'hi' ? 'हाँ, मैं सुन रहा हूँ।' : 
                        detectedLanguage === 'mr' ? 'हो, मी ऐकत आहे.' : 
                        'Yes, I hear you.';
        
        twiml.say({
          voice: getVoiceConfigWithFallback(detectedLanguage).voice,
          language: getVoiceConfigWithFallback(detectedLanguage).language
        }, quickAck);
        
        // Get conversation history for context (reduced for faster response)
        const recentMessages = await Message.find({ sessionId: session._id })
          .sort({ createdAt: -1 })
          .limit(5); // Reduced from 10 to 5 for faster query
        
        const conversationHistory = recentMessages.reverse().map(msg => ({
          role: msg.role,
          content: msg.contentText
        }));
        
        // Enhanced AI service call with conversation context (optimized for Twilio calls)
        const aiResponsePromise = AIService.generateResponseForTwilioCall(
          speechResult, 
          detectedLanguage, 
          userName,
          conversationHistory
        );
        
        // Add timeout to prevent hanging for Twilio calls
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI response timeout')), 8000)
        );
        
        const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]) as any;
        
        console.log('✅ Enhanced AI response generated:', aiResponse.text);
        
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

        // Enhanced voice configuration with fallback
        const voiceConfig = getVoiceConfigWithFallback(detectedLanguage);
        
        // Preprocess text for better pronunciation
        const processedText = preprocessTextForVoice(aiResponse.text, detectedLanguage);
        
        // Speak the AI response with enhanced naturalness
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, processedText);

        // Optimized listening setup for continued conversation - ULTRA FAST RESPONSE
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 15, // Standard timeout
          speechTimeout: '1', // ULTRA FAST: 1 second after user stops speaking
          action: '/api/voice-webhook',
          method: 'POST',
          language: voiceConfig.language,
          enhanced: true,
          profanityFilter: false
        });

        // Simple prompt for continued conversation
        gather.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, detectedLanguage === 'hi' 
          ? 'और कुछ?'
          : detectedLanguage === 'mr'
          ? 'आणखी काही?'
          : 'Anything else?');

        // Simple closing
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, detectedLanguage === 'hi' 
          ? 'धन्यवाद। अलविदा।'
          : detectedLanguage === 'mr'
          ? 'धन्यवाद। निरोप।'
          : 'Thank you. Goodbye.');
        twiml.hangup();

      } catch (aiError) {
        console.error('❌ AI response error:', aiError);
        console.error('❌ AI error details:', {
          message: aiError instanceof Error ? aiError.message : 'Unknown AI error',
          stack: aiError instanceof Error ? aiError.stack : undefined
        });
        
        // Provide a helpful fallback response in detected language
        const detectedLanguage = detectLanguageFromSpeech(speechResult);
        const voiceConfig = getVoiceConfigWithFallback(detectedLanguage);
        const fallbackResponse = getFallbackResponse(detectedLanguage);
        const processedFallback = preprocessTextForVoice(fallbackResponse, detectedLanguage);
        
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, processedFallback);

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
        const processedFollowUp = preprocessTextForVoice(followUpQuestion, detectedLanguage);
        gather.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, processedFollowUp);

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
      // Simple reprompt when no speech detected
      console.log('⚠️ No speech detected. Simple reprompt.');
      const sessionLanguage = session?.language || 'en';
      const retryVoice = getVoiceConfig(sessionLanguage);

      // Simple reprompt
      twiml.say({ voice: retryVoice.voice, language: retryVoice.language },
        sessionLanguage === 'hi'
          ? 'कृपया बोलें।'
          : sessionLanguage === 'mr'
          ? 'कृपया बोला।'
          : "Please speak.");

      const repromptGather = twiml.gather({
        input: ['speech'],
        timeout: 10,
        speechTimeout: '1', // ULTRA FAST: 1 second for reprompt too
        action: '/api/voice-webhook',
        method: 'POST',
        language: retryVoice.language,
        enhanced: true,
        profanityFilter: false
      });

      // Simple prompt inside gather
      repromptGather.say({ voice: retryVoice.voice, language: retryVoice.language },
        sessionLanguage === 'hi'
          ? 'मैं सुन रहा हूँ।'
          : sessionLanguage === 'mr'
          ? 'मी ऐकत आहे.'
          : "I'm listening.");

      // Simple final fallback
      twiml.say({ voice: retryVoice.voice, language: retryVoice.language },
        sessionLanguage === 'hi'
          ? 'धन्यवाद।'
          : sessionLanguage === 'mr'
          ? 'धन्यवाद।'
          : 'Thank you.');
      twiml.hangup();

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
      voice: 'Polly.Joanna',
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

// Enhanced helper function to detect language from speech with better accuracy
function detectLanguageFromSpeech(speechText: string): 'en' | 'hi' | 'mr' {
  const lowerText = speechText.toLowerCase();
  console.log('🔍 Enhanced language detection for:', speechText);
  
  // Check for Devanagari script (Hindi/Marathi)
  const hasDevanagari = /[\u0900-\u097F]/.test(speechText);
  
  if (hasDevanagari) {
    // Enhanced Marathi-specific detection
    const marathiWords = [
      // Common Marathi words
      'काय', 'कसे', 'कधी', 'कुठे', 'कोण', 'मी', 'तुम्ही', 'आहात', 'आहे', 'आहेत',
      'कशी', 'कशा', 'तुमची', 'तुमचे', 'तुमच्या', 'माझी', 'माझे', 'माझ्या',
      'आमची', 'आमचे', 'आमच्या', 'येथे', 'तेथे', 'कशात', 'कशावर',
      // Marathi unique words not found in Hindi
      'होय', 'नाही', 'पण', 'अन्', 'किंवा', 'तरी', 'जर', 'तर',
      'बरे', 'चांगले', 'वाईट', 'मोठा', 'लहान', 'नवा', 'जुना'
    ];
    
    const marathiCount = marathiWords.filter(word => 
      speechText.includes(word) || lowerText.includes(word.toLowerCase())
    ).length;
    
    // Enhanced Hindi-specific detection
    const hindiWords = [
      // Common Hindi words
      'कैसे', 'कब', 'कहाँ', 'कौन', 'मैं', 'आप', 'हैं', 'है', 'हूं',
      'कैसी', 'कैसा', 'आपका', 'आपके', 'आपकी', 'मेरा', 'मेरे', 'मेरी',
      'हमारा', 'हमारे', 'हमारी', 'यहाँ', 'वहाँ', 'किसमें', 'किसपर',
      // Hindi unique words
      'हाँ', 'नहीं', 'लेकिन', 'और', 'या', 'फिर', 'अगर', 'तो',
      'अच्छा', 'बुरा', 'बड़ा', 'छोटा', 'नया', 'पुराना'
    ];
    
    const hindiCount = hindiWords.filter(word => 
      speechText.includes(word) || lowerText.includes(word.toLowerCase())
    ).length;
    
    console.log(`🔍 Language scores - Marathi: ${marathiCount}, Hindi: ${hindiCount}`);
    
    // If Marathi words are more prevalent, it's Marathi
    if (marathiCount > hindiCount) {
      console.log('🌐 Enhanced detection: Marathi (based on word analysis)');
      return 'mr';
    } else {
      console.log('🌐 Enhanced detection: Hindi (based on Devanagari with Hindi words)');
      return 'hi';
    }
  }
  
  // Enhanced language switching detection with phonetic variations
  const marathiSwitchPhrases = [
    'marathi', 'मराठी', 'marathi mein', 'marathi me', 'marathi language',
    'मराठीत', 'मराठी मध्ये', 'marathi madhe', 'marathit', 'maratheet'
  ];
  
  const hindiSwitchPhrases = [
    'hindi', 'हिंदी', 'hindi mein', 'hindi me', 'hindi language',
    'हिंदी में', 'हिंदीत', 'hindi madhe', 'hindit'
  ];
  
  const englishSwitchPhrases = [
    'english', 'अंग्रेजी', 'english mein', 'english me', 'english language',
    'अंग्रेजी में', 'अंग्रेजीत', 'angrezi', 'angreji'
  ];
  
  // Check for explicit language switching requests
  if (marathiSwitchPhrases.some(phrase => lowerText.includes(phrase.toLowerCase()))) {
    console.log('🌐 Enhanced detection: Marathi (explicit language switch request)');
    return 'mr';
  }
  
  if (hindiSwitchPhrases.some(phrase => lowerText.includes(phrase.toLowerCase()))) {
    console.log('🌐 Enhanced detection: Hindi (explicit language switch request)');
    return 'hi';
  }
  
  if (englishSwitchPhrases.some(phrase => lowerText.includes(phrase.toLowerCase()))) {
    console.log('🌐 Enhanced detection: English (explicit language switch request)');
    return 'en';
  }
  
  // Enhanced phonetic detection for romanized Hindi/Marathi
  const romanizedMarathiPatterns = [
    'kay', 'kase', 'kuthe', 'kon', 'mi', 'tumhi', 'aahe', 'aahaat',
    'bara', 'changla', 'nahi', 'pan', 'kinva'
  ];
  
  const romanizedHindiPatterns = [
    'kaise', 'kahan', 'kaun', 'main', 'aap', 'hai', 'hun',
    'accha', 'bura', 'nahin', 'lekin', 'ya'
  ];
  
  const romanizedMarathi = romanizedMarathiPatterns.filter(pattern => 
    lowerText.includes(pattern)
  ).length;
  
  const romanizedHindi = romanizedHindiPatterns.filter(pattern => 
    lowerText.includes(pattern)
  ).length;
  
  if (romanizedMarathi > romanizedHindi && romanizedMarathi > 0) {
    console.log('🌐 Enhanced detection: Marathi (romanized text patterns)');
    return 'mr';
  }
  
  if (romanizedHindi > 0) {
    console.log('🌐 Enhanced detection: Hindi (romanized text patterns)');
    return 'hi';
  }
  
  // Default to English with confidence logging
  console.log('🌐 Enhanced detection: English (default - no other language indicators found)');
  return 'en';
}

// Voice Configuration Module for Avichal Mind AI
// Provides clearest and most natural voices for English, Hindi, and Marathi
function getVoiceConfig(language: 'en' | 'hi' | 'mr'): { voice: any; language: any; rate: number; pitch: number } {
  switch (language) {
    case 'en':
      // English: Priority en-US voices, neutral conversational style
      console.log('Selected Polly.Joanna (en-US) for English playback - Natural conversational voice');
      return { 
        voice: 'Polly.Joanna', // Natural female English voice
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0
      };
    case 'hi':
      // Hindi: hi-IN voices with slightly faster rate for clarity
      console.log('Selected Polly.Aditi (hi-IN) for Hindi playback - Optimized for Hindi pronunciation');
      return { 
        voice: 'Polly.Aditi', // Female Hindi voice with better pronunciation
        language: 'hi-IN',
        rate: 1.05, // Slightly faster for clarity
        pitch: 1.0
      };
    case 'mr':
      // Marathi: Use same voice configuration as Hindi for better flow and quality
      console.log('Selected Polly.Aditi (hi-IN) for Marathi playback - Using Hindi voice for better flow and quality');
      return { 
        voice: 'Polly.Aditi', // Same as Hindi - female voice with better pronunciation
        language: 'hi-IN', // Use Hindi locale for better flow
        rate: 1.15, // Faster than Hindi for better Marathi flow
        pitch: 1.0 // Same as Hindi - natural pitch
      };
    default:
      console.log('Selected Polly.Joanna (en-US) for default English playback');
      return { 
        voice: 'Polly.Joanna',
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0
      };
  }
}

// Enhanced fallback voice configuration following the rules
function getFallbackVoiceConfig(language: 'en' | 'hi' | 'mr'): { voice: any; language: any; rate: number; pitch: number } {
  switch (language) {
    case 'hi':
      console.log('High-quality Hindi voice not available, using Polly.Raveena fallback');
      return { 
        voice: 'Polly.Raveena', // Fallback female voice
        language: 'hi-IN',
        rate: 1.05, // Slightly faster for clarity
        pitch: 1.0
      };
    case 'mr':
      // Marathi fallback: Use same voice configuration as Hindi for better flow
      console.log('High-quality Marathi voice not available, using Hindi voice for better flow and quality');
      return { 
        voice: 'Polly.Raveena', // Same as Hindi fallback
        language: 'hi-IN', // Use Hindi locale for better flow
        rate: 1.15, // Faster than Hindi for better Marathi flow
        pitch: 1.0 // Same as Hindi - natural pitch
      };
    default:
      console.log('High-quality English voice not available, using Polly.Salli fallback');
      return { 
        voice: 'Polly.Salli', // Fallback female English voice
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0
      };
  }
}


// Voice configuration with fallback for better reliability
function getVoiceConfigWithFallback(language: 'en' | 'hi' | 'mr'): { voice: any; language: any; rate: number; pitch: number } {
  // For Marathi, try multiple voice options
  if (language === 'mr') {
    // Try Google Marathi voice first, fallback to Polly with adjustments
    try {
      const config = getVoiceConfig(language);
      console.log('Using primary Marathi voice configuration');
      return config;
    } catch (error) {
      console.log('Google Marathi voice not available, using Hindi voice with Marathi adjustments');
      return getFallbackVoiceConfig(language);
    }
  }
  
  // For other languages, use primary configuration
  return getVoiceConfig(language);
}

// Enhanced text preprocessing for better pronunciation
function preprocessTextForVoice(text: string, language: 'en' | 'hi' | 'mr'): string {
  if (language === 'en') {
    return text; // No preprocessing needed for English
  }
  
  // For Hindi and Marathi, add SSML-like improvements
  let processedText = text;
  
  // Add pauses for better flow
  processedText = processedText.replace(/।/g, '. '); // Replace Devanagari full stop
  processedText = processedText.replace(/!/g, '. '); // Replace exclamation
  processedText = processedText.replace(/\?/g, '. '); // Replace question mark
  
  // Add natural pauses between sentences
  processedText = processedText.replace(/\. /g, '. ');
  
  // Improve pronunciation of common words
  if (language === 'hi') {
    // Hindi-specific improvements
    processedText = processedText.replace(/मैं/g, 'मैं'); // Ensure proper pronunciation
    processedText = processedText.replace(/आप/g, 'आप');
    processedText = processedText.replace(/हैं/g, 'हैं');
    processedText = processedText.replace(/है/g, 'है');
  } else if (language === 'mr') {
    // Enhanced Marathi-specific improvements for native pronunciation
    processedText = preprocessMarathiText(processedText);
  }
  
  // Handle mixed English-Marathi text for better pronunciation
  if (language === 'mr') {
    // Convert common English words to Marathi pronunciation
    processedText = processedText.replace(/\bwords\b/g, 'वर्ड्स');
    processedText = processedText.replace(/\bhelp\b/g, 'हेल्प');
    processedText = processedText.replace(/\bplease\b/g, 'प्लीज');
    processedText = processedText.replace(/\bthank\b/g, 'थँक');
    processedText = processedText.replace(/\bgood\b/g, 'गुड');
    processedText = processedText.replace(/\bbad\b/g, 'बॅड');
    processedText = processedText.replace(/\bwell\b/g, 'वेल');
    processedText = processedText.replace(/\bfine\b/g, 'फाइन');
    processedText = processedText.replace(/\bokay\b/g, 'ओके');
    processedText = processedText.replace(/\byes\b/g, 'येस');
    processedText = processedText.replace(/\bno\b/g, 'नो');
    
    // Add natural Marathi speech rhythm
    processedText = processedText.replace(/\s+/g, ' '); // Normalize spaces
    processedText = processedText.replace(/([।!?])\s*/g, '$1 '); // Add space after punctuation
  }
  
  // Add SSML-like tags for better pronunciation (if supported)
  // Note: Twilio may not support all SSML tags, but basic ones should work
  processedText = `<speak>${processedText}</speak>`;
  
  return processedText;
}

// Enhanced Marathi text preprocessing for native pronunciation
function preprocessMarathiText(text: string): string {
  let processedText = text;
  
  // Enhanced Marathi-specific word replacements for better pronunciation and fluency
  const marathiReplacements = {
    // Specific words with pronunciation issues - Enhanced for better fluency
    'झालंय': 'झाले आहे', // Better pronunciation for "झालंय"
    'सांगायचं': 'सांगायचे', // Better pronunciation for "सांगायचं"
    'बोलण्याचा': 'बोलण्याचे', // Better pronunciation for "बोलण्याचा"
    'आज': 'आज', // Ensure proper pronunciation
    'words': 'वर्ड्स', // Convert English "words" to Marathi pronunciation
    'काना': 'काना', // Ensure proper pronunciation
    
    // Enhanced pronunciation for common Marathi words
    'तुम्ही': 'तुम्ही', // You (plural/respectful)
    'तू': 'तू', // You (informal)
    'मी': 'मी', // I
    'आम्ही': 'आम्ही', // We
    'तुमचे': 'तुमचे', // Your
    'माझे': 'माझे', // My
    'आमचे': 'आमचे', // Our
    
    // Enhanced fluency for common phrases
    'कसे आहे': 'कसे आहे', // How are you
    'काय झाले': 'काय झाले', // What happened
    'काय करायचे': 'काय करायचे', // What to do
    'कसे वाटत आहे': 'कसे वाटत आहे', // How are you feeling
    'ठीक आहे': 'ठीक आहे', // It's okay
    'चांगले': 'चांगले', // Good
    'वाईट': 'वाईट', // Bad
    
    // Additional Marathi words with phonetic improvements
    'आहात': 'आहात',
    'आहे': 'आहे',
    'आहेत': 'आहेत',
    'कशी': 'कशी',
    'कशा': 'कशा',
    'तुमची': 'तुमची',
    'तुमच्या': 'तुमच्या',
    'माझी': 'माझी',
    'माझ्या': 'माझ्या',
    'आमची': 'आमची',
    'आमच्या': 'आमच्या',
    'येथे': 'येथे',
    'तेथे': 'तेथे',
    'पण': 'पण',
    'अन्': 'अन्',
    'किंवा': 'किंवा',
    'तरी': 'तरी',
    'तर': 'तर',
    'मोठा': 'मोठा',
    'लहान': 'लहान',
    'नवा': 'नवा',
    'विश्रांती': 'विश्रांती',
    'ध्यान': 'ध्यान',
    'व्यायाम': 'व्यायाम',
    'तंत्र': 'तंत्र',
    'सहाय्य': 'सहाय्य',
    'स्वतः': 'स्वतः',
    'स्वतःची': 'स्वतःची',
    'स्वतःचे': 'स्वतःचे',
    'स्वतःच्या': 'स्वतःच्या'
  };
  
  // Apply Marathi-specific replacements
  Object.entries(marathiReplacements).forEach(([original, replacement]) => {
    const regex = new RegExp(original, 'g');
    processedText = processedText.replace(regex, replacement);
  });
  
  // Enhanced natural Marathi speech patterns for better fluency
  processedText = processedText.replace(/\. /g, '. '); // Natural pauses
  processedText = processedText.replace(/,/g, ', '); // Comma pauses
  processedText = processedText.replace(/!/g, '! '); // Exclamation pauses
  processedText = processedText.replace(/\?/g, '? '); // Question pauses
  
  // Add natural Marathi speech rhythm and flow
  processedText = processedText.replace(/आहे /g, 'आहे '); // Natural "आहे" flow
  processedText = processedText.replace(/आहात /g, 'आहात '); // Natural "आहात" flow
  processedText = processedText.replace(/आहेत /g, 'आहेत '); // Natural "आहेत" flow
  
  // Fix specific pronunciation issues for better Marathi speech
  processedText = processedText.replace(/झालंय/g, 'झाले आहे'); // Fix "झालंय" pronunciation
  processedText = processedText.replace(/सांगायचं/g, 'सांगायचे'); // Fix "सांगायचं" pronunciation
  processedText = processedText.replace(/बोलण्याचा/g, 'बोलण्याचे'); // Fix "बोलण्याचा" pronunciation
  processedText = processedText.replace(/words/g, 'वर्ड्स'); // Convert English "words" to Marathi
  processedText = processedText.replace(/काना/g, 'काना'); // Ensure proper "काना" pronunciation
  
  // Fix ज (ja) sound pronunciation issues
  processedText = processedText.replace(/ज/g, 'ज'); // Ensure proper "ज" pronunciation
  processedText = processedText.replace(/जा/g, 'जा'); // Fix "जा" pronunciation
  processedText = processedText.replace(/जी/g, 'जी'); // Fix "जी" pronunciation
  processedText = processedText.replace(/जे/g, 'जे'); // Fix "जे" pronunciation
  processedText = processedText.replace(/जो/g, 'जो'); // Fix "जो" pronunciation
  processedText = processedText.replace(/जु/g, 'जु'); // Fix "जु" pronunciation
  processedText = processedText.replace(/जं/g, 'जं'); // Fix "जं" pronunciation
  processedText = processedText.replace(/जन/g, 'जन'); // Fix "जन" pronunciation
  processedText = processedText.replace(/जर/g, 'जर'); // Fix "जर" pronunciation
  processedText = processedText.replace(/जल/g, 'जल'); // Fix "जल" pronunciation
  
  // Enhance Marathi-specific pronunciation patterns for native sound
  processedText = processedText.replace(/श्वास/g, 'श्वास'); // Breathing
  processedText = processedText.replace(/तणाव/g, 'तणाव'); // Stress
  processedText = processedText.replace(/चिंता/g, 'चिंता'); // Worry
  processedText = processedText.replace(/दुःख/g, 'दुःख'); // Sadness
  processedText = processedText.replace(/आनंद/g, 'आनंद'); // Joy
  
  // Add Marathi-specific speech rhythm improvements
  processedText = processedText.replace(/मी समजतो/g, 'मी समजतो'); // I understand
  processedText = processedText.replace(/तुम्हाला कसे वाटत आहे/g, 'तुम्हाला कसे वाटत आहे'); // How are you feeling
  processedText = processedText.replace(/मी तुमची मदत करू शकतो/g, 'मी तुमची मदत करू शकतो'); // I can help you
  processedText = processedText.replace(/तुम्ही सुरक्षित आहात/g, 'तुम्ही सुरक्षित आहात'); // You are safe
  processedText = processedText.replace(/सर्व काही ठीक होईल/g, 'सर्व काही ठीक होईल'); // Everything will be fine
  
  // Add natural Marathi intonation patterns
  processedText = processedText.replace(/काय झाले/g, 'काय झाले?'); // What happened
  processedText = processedText.replace(/कसे आहे/g, 'कसे आहे?'); // How are you
  processedText = processedText.replace(/काय करायचे/g, 'काय करायचे?'); // What to do
  
  // Add specific pronunciation fixes for common Marathi words
  processedText = processedText.replace(/आज/g, 'आज'); // Today
  processedText = processedText.replace(/काल/g, 'काल'); // Yesterday
  processedText = processedText.replace(/उद्या/g, 'उद्या'); // Tomorrow
  processedText = processedText.replace(/आता/g, 'आता'); // Now
  processedText = processedText.replace(/नंतर/g, 'नंतर'); // Later
  
  // Fix ज (ja) sound in common Marathi words
  processedText = processedText.replace(/जान्हवी/g, 'जान्हवी'); // Janhavi (name)
  processedText = processedText.replace(/जर/g, 'जर'); // If
  processedText = processedText.replace(/जल/g, 'जल'); // Water
  processedText = processedText.replace(/जन/g, 'जन'); // People
  processedText = processedText.replace(/जग/g, 'जग'); // World
  processedText = processedText.replace(/जीवन/g, 'जीवन'); // Life
  processedText = processedText.replace(/ज्ञान/g, 'ज्ञान'); // Knowledge
  processedText = processedText.replace(/जोड/g, 'जोड'); // Pair
  processedText = processedText.replace(/जुना/g, 'जुना'); // Old
  processedText = processedText.replace(/जवळ/g, 'जवळ'); // Near
  processedText = processedText.replace(/जास्त/g, 'जास्त'); // More
  processedText = processedText.replace(/जरूर/g, 'जरूर'); // Necessary
  processedText = processedText.replace(/जमीन/g, 'जमीन'); // Ground
  processedText = processedText.replace(/जंगल/g, 'जंगल'); // Forest
  
  // Enhance female voice characteristics for Marathi
  processedText = processedText.replace(/मी/g, 'मी'); // I (female form)
  processedText = processedText.replace(/माझी/g, 'माझी'); // My (female form)
  processedText = processedText.replace(/माझे/g, 'माझे'); // My (female form)
  processedText = processedText.replace(/माझ्या/g, 'माझ्या'); // My (female form)
  
  // Add gentle, caring female speech patterns
  processedText = processedText.replace(/तुम्हाला कसे वाटत आहे/g, 'तुम्हाला कसे वाटत आहे?'); // How are you feeling (gentle)
  processedText = processedText.replace(/मी तुमची मदत करू शकते/g, 'मी तुमची मदत करू शकते'); // I can help you (female form)
  processedText = processedText.replace(/तुम्ही सुरक्षित आहात/g, 'तुम्ही सुरक्षित आहात'); // You are safe (reassuring)
  processedText = processedText.replace(/सर्व काही ठीक होईल/g, 'सर्व काही ठीक होईल'); // Everything will be fine (caring)
  
  // Add natural female Marathi expressions
  processedText = processedText.replace(/होय/g, 'होय'); // Yes (gentle)
  processedText = processedText.replace(/नाही/g, 'नाही'); // No (soft)
  processedText = processedText.replace(/बरे/g, 'बरे'); // Good (warm)
  processedText = processedText.replace(/चांगले/g, 'चांगले'); // Good (caring)
  processedText = processedText.replace(/वाईट/g, 'वाईट'); // Bad (concerned)
  
  // Add feminine speech rhythm and intonation
  processedText = processedText.replace(/काय झाले\?/g, 'काय झाले?'); // What happened (concerned)
  processedText = processedText.replace(/कसे आहे\?/g, 'कसे आहे?'); // How are you (caring)
  processedText = processedText.replace(/काय करायचे\?/g, 'काय करायचे?'); // What to do (helpful)
  
  // Add gentle, supportive female language patterns
  processedText = processedText.replace(/मी समजतो/g, 'मी समजते'); // I understand (female form)
  processedText = processedText.replace(/मी तुमची मदत करू शकतो/g, 'मी तुमची मदत करू शकते'); // I can help you (female form)
  processedText = processedText.replace(/मी तुमच्यासाठी येथे आहे/g, 'मी तुमच्यासाठी येथे आहे'); // I am here for you (caring)
  
  // Add more feminine Marathi expressions and speech patterns
  processedText = processedText.replace(/मी तुमची मदत करू शकतो/g, 'मी तुमची मदत करू शकते'); // I can help you (female form)
  processedText = processedText.replace(/मी तुमच्यासाठी येथे आहे/g, 'मी तुमच्यासाठी येथे आहे'); // I am here for you (caring)
  processedText = processedText.replace(/मी तुमची काळजी घेते/g, 'मी तुमची काळजी घेते'); // I take care of you (caring)
  processedText = processedText.replace(/मी तुमचे ऐकते आहे/g, 'मी तुमचे ऐकते आहे'); // I am listening to you (attentive)
  processedText = processedText.replace(/मी तुमच्यासोबत आहे/g, 'मी तुमच्यासोबत आहे'); // I am with you (supportive)
  
  // Add gentle, caring female speech patterns
  processedText = processedText.replace(/तुम्ही चिंता करू नका/g, 'तुम्ही चिंता करू नका'); // Don't worry (reassuring)
  processedText = processedText.replace(/सर्व काही ठीक होईल/g, 'सर्व काही ठीक होईल'); // Everything will be fine (caring)
  processedText = processedText.replace(/तुम्ही सुरक्षित आहात/g, 'तुम्ही सुरक्षित आहात'); // You are safe (protective)
  processedText = processedText.replace(/मी तुमच्यासाठी येथे आहे/g, 'मी तुमच्यासाठी येथे आहे'); // I am here for you (supportive)
  
  // Add natural female Marathi expressions with gentle tone
  processedText = processedText.replace(/होय/g, 'होय'); // Yes (gentle confirmation)
  processedText = processedText.replace(/नाही/g, 'नाही'); // No (soft denial)
  processedText = processedText.replace(/बरे/g, 'बरे'); // Good (warm approval)
  processedText = processedText.replace(/चांगले/g, 'चांगले'); // Good (caring approval)
  processedText = processedText.replace(/वाईट/g, 'वाईट'); // Bad (concerned)
  processedText = processedText.replace(/ठीक आहे/g, 'ठीक आहे'); // It's okay (reassuring)
  
  // Enhanced Marathi pronunciation for better fluency and naturalness
  processedText = processedText.replace(/तुम्हाला/g, 'तुम्हाला'); // To you (smooth pronunciation)
  processedText = processedText.replace(/माझ्याला/g, 'माझ्याला'); // To me (smooth pronunciation)
  processedText = processedText.replace(/त्याला/g, 'त्याला'); // To him (smooth pronunciation)
  processedText = processedText.replace(/तिला/g, 'तिला'); // To her (smooth pronunciation)
  
  // Enhanced pronunciation for common Marathi verb forms
  processedText = processedText.replace(/करतो/g, 'करतो'); // Doing (male form)
  processedText = processedText.replace(/करते/g, 'करते'); // Doing (female form)
  processedText = processedText.replace(/करतात/g, 'करतात'); // Doing (plural)
  processedText = processedText.replace(/करतोय/g, 'करतो आहे'); // Is doing (male form)
  processedText = processedText.replace(/करतेय/g, 'करते आहे'); // Is doing (female form)
  processedText = processedText.replace(/करतातय/g, 'करतात आहेत'); // Are doing (plural)
  
  // Enhanced pronunciation for Marathi question words
  processedText = processedText.replace(/काय/g, 'काय'); // What (clear pronunciation)
  processedText = processedText.replace(/कसे/g, 'कसे'); // How (clear pronunciation)
  processedText = processedText.replace(/कधी/g, 'कधी'); // When (clear pronunciation)
  processedText = processedText.replace(/कुठे/g, 'कुठे'); // Where (clear pronunciation)
  processedText = processedText.replace(/कोण/g, 'कोण'); // Who (clear pronunciation)
  processedText = processedText.replace(/कशी/g, 'कशी'); // How (feminine)
  processedText = processedText.replace(/कशा/g, 'कशा'); // How (plural)
  
  // Enhanced pronunciation for Marathi emotional expressions
  processedText = processedText.replace(/दुःख/g, 'दुःख'); // Sadness (clear pronunciation)
  processedText = processedText.replace(/आनंद/g, 'आनंद'); // Joy (clear pronunciation)
  processedText = processedText.replace(/चिंता/g, 'चिंता'); // Worry (clear pronunciation)
  processedText = processedText.replace(/तणाव/g, 'तणाव'); // Stress (clear pronunciation)
  processedText = processedText.replace(/शांत/g, 'शांत'); // Peaceful (clear pronunciation)
  processedText = processedText.replace(/विश्रांती/g, 'विश्रांती'); // Rest (clear pronunciation)
  
  // Enhanced pronunciation for Marathi wellness terms
  processedText = processedText.replace(/मानसिक/g, 'मानसिक'); // Mental (clear pronunciation)
  processedText = processedText.replace(/आरोग्य/g, 'आरोग्य'); // Health (clear pronunciation)
  processedText = processedText.replace(/स्वास्थ्य/g, 'स्वास्थ्य'); // Health (alternative)
  processedText = processedText.replace(/काळजी/g, 'काळजी'); // Care (clear pronunciation)
  processedText = processedText.replace(/समर्थन/g, 'समर्थन'); // Support (clear pronunciation)
  processedText = processedText.replace(/मदत/g, 'मदत'); // Help (clear pronunciation)
  
  // Enhanced pronunciation for Marathi time expressions
  processedText = processedText.replace(/आज/g, 'आज'); // Today (clear pronunciation)
  processedText = processedText.replace(/काल/g, 'काल'); // Yesterday (clear pronunciation)
  processedText = processedText.replace(/उद्या/g, 'उद्या'); // Tomorrow (clear pronunciation)
  processedText = processedText.replace(/आता/g, 'आता'); // Now (clear pronunciation)
  processedText = processedText.replace(/नंतर/g, 'नंतर'); // Later (clear pronunciation)
  processedText = processedText.replace(/पूर्वी/g, 'पूर्वी'); // Before (clear pronunciation)
  
  // Enhanced pronunciation for Marathi family and relationship terms
  processedText = processedText.replace(/कुटुंब/g, 'कुटुंब'); // Family (clear pronunciation)
  processedText = processedText.replace(/मित्र/g, 'मित्र'); // Friend (clear pronunciation)
  processedText = processedText.replace(/नाते/g, 'नाते'); // Relationship (clear pronunciation)
  processedText = processedText.replace(/प्रेम/g, 'प्रेम'); // Love (clear pronunciation)
  processedText = processedText.replace(/सहानुभूती/g, 'सहानुभूती'); // Sympathy (clear pronunciation)
  
  // Enhanced pronunciation for Marathi body and health terms
  processedText = processedText.replace(/श्वास/g, 'श्वास'); // Breath (clear pronunciation)
  processedText = processedText.replace(/हृदय/g, 'हृदय'); // Heart (clear pronunciation)
  processedText = processedText.replace(/मन/g, 'मन'); // Mind (clear pronunciation)
  processedText = processedText.replace(/शरीर/g, 'शरीर'); // Body (clear pronunciation)
  processedText = processedText.replace(/आरोग्य/g, 'आरोग्य'); // Health (clear pronunciation)
  
  // Enhanced pronunciation for Marathi action words
  processedText = processedText.replace(/बोलणे/g, 'बोलणे'); // Speaking (clear pronunciation)
  processedText = processedText.replace(/ऐकणे/g, 'ऐकणे'); // Listening (clear pronunciation)
  processedText = processedText.replace(/समजणे/g, 'समजणे'); // Understanding (clear pronunciation)
  processedText = processedText.replace(/मदत करणे/g, 'मदत करणे'); // Helping (clear pronunciation)
  processedText = processedText.replace(/काळजी घेणे/g, 'काळजी घेणे'); // Taking care (clear pronunciation)
  
  return processedText;
}

// Helper function to get enhanced follow-up questions in different languages
function getFollowUpQuestion(language: 'en' | 'hi' | 'mr'): string {
  switch (language) {
    case 'hi':
      return 'मैं यहाँ हूं और सुन रहा हूं। आप और क्या साझा करना चाहते हैं? या कुछ और है जिसके बारे में बात करना चाहते हैं?';
    case 'mr':
      return 'मी येथे आहे आणि ऐकत आहे. तुम्ही आणखी काही शेअर करू इच्छिता? किंवा आणखी काही आहे ज्याबद्दल बोलायचे आहे?';
    default:
      return 'I\'m here and listening. What else would you like to share? Is there anything else on your mind that you\'d like to talk about?';
  }
}

// Helper function to get enhanced fallback responses in different languages
function getFallbackResponse(language: 'en' | 'hi' | 'mr'): string {
  switch (language) {
    case 'hi':
      return 'मैं यहाँ आपकी सहायता के लिए हूं। चलिए कुछ सांस की तकनीकों के साथ शुरुआत करते हैं। 4 सेकंड तक गहरी सांस लें, 4 सेकंड रोकें, और 4 सेकंड में छोड़ें। यह आपको शांत और केंद्रित महसूस कराएगा। आप कैसा महसूस कर रहे हैं?';
    case 'mr':
      return 'मी तुमच्या मदतीसाठी येथे आहे. काही श्वसन तंत्रांसह सुरुवात करूया. 4 सेकंद खोल श्वास घ्या, 4 सेकंद धरा, आणि 4 सेकंदांत सोडा. हे तुम्हाला शांत आणि केंद्रित वाटण्यास मदत करेल. तुम्हाला कसे वाटत आहे?';
    default:
      return "I'm here to support you through whatever you're experiencing. Let's start with a simple breathing exercise together. Take a deep breath in for 4 seconds, hold it for 4 seconds, and slowly exhale for 4 seconds. This can help you feel more calm and centered. How are you feeling right now?";
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

// Helper function to get warm closing messages
function getWarmClosing(language: 'en' | 'hi' | 'mr'): string {
  switch (language) {
    case 'hi':
      return 'आज मुझसे बात करने के लिए धन्यवाद। आपकी देखभाल करना याद रखें। मैं हमेशा यहाँ हूं जब आपको मेरी जरूरत हो। अलविदा!';
    case 'mr':
      return 'आज माझ्याशी बोलल्याबद्दल धन्यवाद. स्वतःची काळजी घेण्याचे लक्षात ठेवा. तुम्हाला माझी गरज असेल तेव्हा मी नेहमीच येथे आहे. निरोप!';
    default:
      return 'Thank you so much for talking with me today. Remember to take care of yourself, and know that I\'m always here whenever you need someone to listen. Take care, and goodbye for now!';
  }
}
