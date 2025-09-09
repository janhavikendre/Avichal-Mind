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
      
      // Simple greeting with standard voice
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, greeting);

      // Simple listening setup - FAST RESPONSE: 1-2 seconds after user stops
      const gather = twiml.gather({
        input: ['speech'],
        timeout: 15,
        speechTimeout: '2', // CRITICAL: 2 seconds for fast AI response
        action: '/api/voice-webhook',
        method: 'POST',
        language: 'en-US',
        enhanced: true,
        profanityFilter: false
      });

      // Simple prompt if they don't speak immediately
      gather.say({
        voice: 'alice',
        language: 'en-US'
      }, 'I\'m listening. Please tell me how you\'re feeling.');

      // Simple fallback
      twiml.say({
        voice: 'alice',
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
        
        // Get conversation history for context
        const recentMessages = await Message.find({ sessionId: session._id })
          .sort({ createdAt: -1 })
          .limit(10);
        
        const conversationHistory = recentMessages.reverse().map(msg => ({
          role: msg.role,
          content: msg.contentText
        }));
        
        // Enhanced AI service call with conversation context
        const aiResponse = await AIService.generateResponse(
          speechResult, 
          detectedLanguage, 
          userName,
          conversationHistory
        );
        
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

        // Enhanced voice configuration
        const voiceConfig = getVoiceConfig(detectedLanguage);
        
        // Speak the AI response with enhanced naturalness
        twiml.say({
          voice: voiceConfig.voice,
          language: voiceConfig.language
        }, aiResponse.text);

        // Simple listening setup for continued conversation - FAST RESPONSE
        const gather = twiml.gather({
          input: ['speech'],
          timeout: 15, // Standard timeout
          speechTimeout: '2', // FAST: 2 seconds after user stops speaking
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
        speechTimeout: '2', // FAST: 2 seconds for reprompt too
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

// Helper function to get simple voice configuration for different languages
function getVoiceConfig(language: 'en' | 'hi' | 'mr'): { voice: 'alice'; language: 'en-US' | 'hi-IN' } {
  switch (language) {
    case 'hi':
      return { voice: 'alice', language: 'hi-IN' };
    case 'mr':
      return { voice: 'alice', language: 'en-US' }; // Use English voice for Marathi
    default:
      return { voice: 'alice', language: 'en-US' };
  }
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
