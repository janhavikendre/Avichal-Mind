import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if Gemini API key is available
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

const genAI = hasGeminiKey ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY!) : null;

export interface AIResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  audioUrl?: string;
  shouldSuggestVideos?: boolean;
}

export class AIService {
  private static systemPrompt = `You are a friendly, intelligent wellness companion for Indian users. Your primary role is to provide practical wellness support and emotional guidance.

IMPORTANT GUIDELINES:
- NEVER give generic responses like "I appreciate you opening up to me" or "What would be most helpful for you right now?"
- ALWAYS provide specific, actionable advice and solutions
- When users ask about stress, anxiety, depression, or wellness topics, give concrete coping strategies
- If you can't provide specific help, suggest relevant wellness videos or resources
- Be culturally sensitive to Indian users
- Respond in the user's preferred language (English, Hindi, or Marathi)

For stress management questions:
- Provide specific breathing exercises, meditation techniques, or lifestyle changes
- Suggest practical time management or relaxation methods
- Offer specific coping strategies they can try immediately

For wellness topics:
- Give actionable advice and specific techniques
- Provide step-by-step guidance when possible
- Suggest relevant resources or activities

Remember: Be specific, helpful, and provide real solutions. Never give generic responses.`;

  static async generateResponse(
    userMessage: string,
    language: 'en' | 'hi' | 'mr',
    userName: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AIResponse> {
    try {
      // If Gemini is not available, use fallback responses
      if (!hasGeminiKey || !genAI) {
        console.warn('Gemini API key not available, using fallback responses');
        return this.getFallbackResponse(userMessage, language, conversationHistory);
      }

      // Analyze message type and context
      const messageAnalysis = this.analyzeMessage(userMessage, conversationHistory);
      const totalMessages = conversationHistory.length + 1; // +1 for current message
      
      // Determine if we should suggest videos (after 8-10 messages with wellness content)
      const shouldSuggestVideos = this.shouldSuggestVideos(messageAnalysis, totalMessages);

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Create conversation context from history
      let conversationContext = '';
      if (conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-8); // Keep last 8 messages for context
        conversationContext = '\n\nPrevious conversation:\n' + 
          recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
      }
      
      // Create intelligent prompt for real-time responses
      const intelligentPrompt = this.createIntelligentPrompt(messageAnalysis, language, userName, userMessage);
      
      // Create the full prompt with conversation history
      const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
      const fullPrompt = `${this.systemPrompt}\n\n${intelligentPrompt}\n\nRespond in ${languageText}. User's name: ${userName}${conversationContext}\n\nCurrent user message: ${userMessage}\n\nProvide a natural, intelligent response:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Estimate token usage (Gemini doesn't provide exact token counts in the same way)
      const estimatedTokensIn = fullPrompt.length / 4;
      const estimatedTokensOut = text.length / 4;

      return {
        text: text || this.getFallbackResponse(userMessage, language, conversationHistory).text,
        tokensIn: estimatedTokensIn,
        tokensOut: estimatedTokensOut,
        shouldSuggestVideos: shouldSuggestVideos,
      };
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      return this.getFallbackResponse(userMessage, language, conversationHistory);
    }
  }

  private static analyzeMessage(userMessage: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): {
    type: 'casual' | 'wellness' | 'general_question' | 'crisis' | 'general';
    topics: string[];
    emotionalTone: 'positive' | 'negative' | 'neutral';
    needsSupport: boolean;
    isQuestion: boolean;
  } {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for crisis content first
    if (this.detectCrisisKeywords(userMessage)) {
      return {
        type: 'crisis',
        topics: ['crisis', 'emergency'],
        emotionalTone: 'negative',
        needsSupport: true,
        isQuestion: false
      };
    }

    // Check if it's a general question
    const isQuestion = this.isQuestion(userMessage);
    const isGeneralQuestion = this.isGeneralQuestion(userMessage);
    
    if (isGeneralQuestion) {
      return {
        type: 'general_question',
        topics: ['general_knowledge'],
        emotionalTone: 'neutral',
        needsSupport: false,
        isQuestion: true
      };
    }

    // Check for casual greetings
    if (this.isCasualGreeting(userMessage)) {
      return {
        type: 'casual',
        topics: ['greeting'],
        emotionalTone: 'neutral',
        needsSupport: false,
        isQuestion: isQuestion
      };
    }

    // Analyze wellness topics
    const wellnessTopics = this.detectWellnessTopics(userMessage);
    const emotionalTone = this.detectEmotionalTone(userMessage);
    const needsSupport = this.needsWellnessSupport(userMessage, conversationHistory);

    return {
      type: needsSupport ? 'wellness' : 'general',
      topics: wellnessTopics,
      emotionalTone,
      needsSupport,
      isQuestion: isQuestion
    };
  }

  private static isQuestion(message: string): boolean {
    const questionIndicators = [
      '?', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you',
      'क्या', 'कैसे', 'क्यों', 'कब', 'कहाँ', 'कौन', 'कौन सा', 'क्या आप', 'क्या तुम',
      'काय', 'कसे', 'का', 'कधी', 'कुठे', 'कोण', 'कोणता', 'काय तुम्ही', 'काय तू'
    ];
    
    const lowerMessage = message.toLowerCase();
    return questionIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  private static isGeneralQuestion(message: string): boolean {
    const generalQuestionKeywords = [
      'alphabet', 'alphabets', 'letters', 'numbers', 'count', 'how many',
      'capital', 'country', 'city', 'population', 'area', 'distance',
      'weather', 'temperature', 'time', 'date', 'year', 'month',
      'color', 'colors', 'shape', 'size', 'weight', 'height',
      'food', 'recipe', 'cooking', 'ingredient', 'nutrition',
      'animal', 'plant', 'species', 'scientific', 'biology',
      'math', 'mathematics', 'calculation', 'equation', 'formula',
      'history', 'historical', 'event', 'war', 'battle',
      'geography', 'map', 'location', 'continent', 'ocean',
      'technology', 'computer', 'software', 'programming', 'code',
      'sports', 'game', 'player', 'team', 'score', 'match',
      'music', 'song', 'artist', 'album', 'genre', 'instrument',
      'movie', 'film', 'actor', 'director', 'genre', 'plot',
      'book', 'author', 'novel', 'story', 'character', 'plot',
      'वर्णमाला', 'अक्षर', 'संख्या', 'गणना', 'कितने',
      'राजधानी', 'देश', 'शहर', 'जनसंख्या', 'क्षेत्र', 'दूरी',
      'मौसम', 'तापमान', 'समय', 'तारीख', 'साल', 'महीना',
      'रंग', 'आकार', 'आकार', 'वजन', 'ऊंचाई',
      'भोजन', 'पकाने', 'सामग्री', 'पोषण',
      'जानवर', 'पौधा', 'प्रजाति', 'वैज्ञानिक', 'जीव विज्ञान',
      'गणित', 'गणना', 'समीकरण', 'सूत्र',
      'इतिहास', 'ऐतिहासिक', 'घटना', 'युद्ध', 'लड़ाई',
      'भूगोल', 'नक्शा', 'स्थान', 'महाद्वीप', 'समुद्र',
      'तकनीक', 'कंप्यूटर', 'सॉफ्टवेयर', 'प्रोग्रामिंग', 'कोड',
      'खेल', 'खिलाड़ी', 'टीम', 'स्कोर', 'मैच',
      'संगीत', 'गीत', 'कलाकार', 'एल्बम', 'शैली', 'वाद्य',
      'फिल्म', 'अभिनेता', 'निर्देशक', 'शैली', 'कहानी',
      'किताब', 'लेखक', 'उपन्यास', 'कहानी', 'पात्र', 'कथानक'
    ];
    
    const lowerMessage = message.toLowerCase();
    return generalQuestionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private static detectWellnessTopics(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const topics: string[] = [];

    const topicKeywords = {
      anxiety: ['anxiety', 'worry', 'stress', 'nervous', 'panic', 'fear', 'overwhelmed', 'tense'],
      depression: ['depression', 'sad', 'hopeless', 'empty', 'worthless', 'down', 'blue', 'miserable'],
      relationships: ['relationship', 'partner', 'family', 'friend', 'love', 'marriage', 'dating', 'breakup'],
      work: ['work', 'job', 'career', 'professional', 'office', 'boss', 'colleague', 'workplace'],
      sleep: ['sleep', 'insomnia', 'rest', 'tired', 'exhausted', 'bed', 'night', 'dream'],
      mindfulness: ['mindfulness', 'meditation', 'breathing', 'calm', 'peace', 'zen', 'yoga', 'relaxation'],
      self_care: ['self care', 'self-care', 'wellness', 'health', 'care', 'healing', 'recovery'],
      emotions: ['emotion', 'feeling', 'mood', 'happy', 'sad', 'angry', 'frustrated', 'joy'],
      grief: ['grief', 'loss', 'death', 'mourning', 'bereavement', 'missing', 'gone'],
      confidence: ['confidence', 'self-esteem', 'worth', 'value', 'believe', 'capable', 'strong']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private static detectEmotionalTone(message: string): 'positive' | 'negative' | 'neutral' {
    const lowerMessage = message.toLowerCase();
    
    const positiveWords = ['happy', 'good', 'great', 'wonderful', 'excellent', 'amazing', 'fantastic', 'joy', 'excited', 'thrilled', 'content', 'satisfied', 'peaceful', 'calm', 'relaxed', 'grateful', 'thankful', 'blessed', 'lucky', 'fortunate'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'horrible', 'depressed', 'anxious', 'worried', 'stressed', 'angry', 'frustrated', 'upset', 'disappointed', 'hurt', 'pain', 'suffering', 'lonely', 'hopeless', 'desperate', 'miserable'];

    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static shouldSuggestVideos(analysis: any, totalMessages: number): boolean {
    // Suggest videos if:
    // 1. It's a wellness-related conversation (especially stress management)
    // 2. We have 3+ messages (more aggressive for stress topics)
    // 3. User needs support
    const isStressTopic = analysis.topics.includes('anxiety') || 
                         analysis.topics.includes('work') || 
                         analysis.topics.includes('self_care');
    
    return analysis.type === 'wellness' && 
           analysis.needsSupport && 
           totalMessages >= 3 && 
           totalMessages <= 20; // Suggest within this range
  }

  private static createIntelligentPrompt(analysis: any, language: 'en' | 'hi' | 'mr', userName: string, userMessage: string): string {
    const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    
    switch (analysis.type) {
      case 'crisis':
        return `CRISIS DETECTED: The user may be in crisis. Provide immediate crisis resources and support. Be compassionate but direct about getting professional help. Respond in ${languageText}.`;
      
      case 'general_question':
        return `The user is asking a general knowledge question. Provide an accurate, helpful, and engaging answer. Be conversational and informative. Respond in ${languageText}.`;
      
      case 'casual':
        return `This is a casual conversation. Respond naturally and engagingly. If it's a greeting, respond warmly. If it's a question about how you are, respond naturally. Keep it friendly and conversational. Respond in ${languageText}.`;
      
             case 'wellness':
         const topicContext = analysis.topics.length > 0 ? 
           `Focus on: ${analysis.topics.join(', ')}. ` : '';
         const toneContext = analysis.emotionalTone === 'negative' ? 
           'The user seems to be struggling emotionally. Provide compassionate support and understanding. ' : '';
         return `${topicContext}${toneContext}This is a wellness-related conversation. Provide SPECIFIC, ACTIONABLE advice and coping strategies. Give concrete techniques they can try immediately. If they ask about stress management, provide breathing exercises, meditation techniques, or lifestyle changes. Be specific and helpful. Respond in ${languageText}.`;
      
      default:
        return `Respond naturally to the user's message. Keep it conversational and friendly while maintaining context. Respond in ${languageText}.`;
    }
  }

  private static getFallbackResponse(
    userMessage: string, 
    language: 'en' | 'hi' | 'mr',
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): AIResponse {
    const analysis = this.analyzeMessage(userMessage, conversationHistory);
    const totalMessages = conversationHistory.length + 1;
    const shouldSuggestVideos = this.shouldSuggestVideos(analysis, totalMessages);
    
    // Check if this is a follow-up message in an ongoing conversation
    const isFollowUp = conversationHistory.length > 0;
    
    // Get context-aware fallback responses
    const fallbackResponses: Record<string, Record<string, string[]>> = {
      en: {
        crisis: [
          "I'm concerned about what you're sharing. Please know that you're not alone, and there are people who want to help. Consider reaching out to a crisis helpline or mental health professional immediately. Your life has value, and there is hope.",
          "What you're experiencing sounds very serious. I want you to know that help is available 24/7. Please contact a crisis helpline or speak with a mental health professional right away. You deserve support and care.",
          "I hear that you're in a very difficult place right now. Please reach out for immediate help - call a crisis helpline or speak with a mental health professional. You don't have to face this alone."
        ],
        general_question: [
          "I'd be happy to help with that! Let me provide you with accurate information.",
          "That's a great question! Here's what I know about that topic.",
          "I can help you with that! Let me share some helpful information.",
          "That's an interesting question! Here's what I can tell you about that.",
          "I'd love to help you with that! Let me provide you with some useful information."
        ],
        casual: [
          "Hello! How are you doing today?",
          "Hi there! Nice to chat with you.",
          "Hey! How's your day going?",
          "Hello! What's on your mind?",
          "Hi! I'm here to listen and support you.",
          "Hello! How can I help you today?",
        ],
        casual_followup: [
          "Hi again! How are things going?",
          "Hello! Nice to hear from you again.",
          "Hey! How has your day been since we last talked?",
          "Hi! What's new with you?",
          "Hello! How are you feeling today?",
        ],
                 wellness: [
           "For stress management, try this 4-7-8 breathing technique: Inhale for 4 counts, hold for 7, exhale for 8. Repeat 5 times. This activates your parasympathetic nervous system and helps you relax immediately.",
           "When feeling overwhelmed, try the 5-4-3-2-1 grounding technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This brings you back to the present moment.",
           "For stress relief, try progressive muscle relaxation: Tense each muscle group for 5 seconds, then release. Start from your toes and work up to your head. This releases physical tension.",
           "Take a 10-minute break to practice mindfulness: Sit comfortably, focus on your breath, and when thoughts come, gently return to breathing. This helps clear your mind.",
           "Try the 20-20-20 rule for eye strain: Every 20 minutes, look at something 20 feet away for 20 seconds. This reduces digital eye strain and mental fatigue."
         ],
                 wellness_followup: [
           "How did the breathing technique work for you? If you need more stress relief, try this quick exercise: Stand up, stretch your arms overhead, take 3 deep breaths, then shake out your hands and arms.",
           "Since we last talked, have you tried any of the relaxation techniques? Here's another quick one: Close your eyes, imagine a peaceful place, and take 5 slow, deep breaths.",
           "I'm here to support you. Try this 2-minute stress buster: Sit straight, place one hand on your chest, one on your belly, and breathe so only your belly hand moves.",
           "How are you feeling now? If still stressed, try this: Tense your shoulders for 5 seconds, then let them drop completely. Repeat 3 times.",
           "Let's try something different: Take a 5-minute walk, even just around your room, while focusing on your breathing. Movement helps release stress hormones."
         ],
        general: [
          "I'm here to listen and support you. What would you like to talk about?",
          "Thank you for reaching out. How can I help you today?",
          "I'm here for you. What's on your mind?",
          "I'm listening. Tell me more about what you're going through.",
          "I'm here to support you. What would you like to discuss?",
        ],
        general_followup: [
          "I'm here to continue our conversation. What would you like to talk about?",
          "Thank you for reaching out again. How can I help you today?",
          "I'm here for you. What's on your mind since we last talked?",
          "I'm listening. Tell me more about what you're going through.",
          "I'm here to support you. What would you like to discuss?",
        ]
      },
      hi: {
        crisis: [
          "मैं आपकी बात सुनकर चिंतित हूं। कृपया जानें कि आप अकेले नहीं हैं और ऐसे लोग हैं जो मदद करना चाहते हैं। कृपया तुरंत किसी संकट हेल्पलाइन या मानसिक स्वास्थ्य पेशेवर से संपर्क करें। आपकी जिंदगी की कीमत है और आशा है।",
          "आप जो अनुभव कर रहे हैं वह बहुत गंभीर लगता है। मैं चाहता हूं कि आप जानें कि मदद 24/7 उपलब्ध है। कृपया तुरंत किसी संकट हेल्पलाइन से संपर्क करें या मानसिक स्वास्थ्य पेशेवर से बात करें।",
          "मैं सुन रहा हूं कि आप अभी बहुत मुश्किल समय से गुजर रहे हैं। कृपया तुरंत मदद के लिए पहुंचें - किसी संकट हेल्पलाइन को कॉल करें या मानसिक स्वास्थ्य पेशेवर से बात करें।"
        ],
        general_question: [
          "मैं आपकी मदद करने में खुशी महसूस करूंगा! मैं आपको सटीक जानकारी प्रदान करता हूं।",
          "यह एक बहुत अच्छा सवाल है! मुझे उस विषय के बारे में जो पता है वह यहां है।",
          "मैं आपकी मदद कर सकता हूं! मैं आपके साथ कुछ उपयोगी जानकारी साझा करता हूं।",
          "यह एक दिलचस्प सवाल है! मैं आपको उसके बारे में जो बता सकता हूं वह यहां है।",
          "मैं आपकी मदद करने में खुशी महसूस करूंगा! मैं आपको कुछ उपयोगी जानकारी प्रदान करता हूं।"
        ],
        casual: [
          "नमस्ते! आज आप कैसे हैं?",
          "हाय! आपसे बात करके अच्छा लगा।",
          "हेलो! आपका दिन कैसा जा रहा है?",
          "नमस्ते! आपके मन में क्या है?",
          "हाय! मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहां हूं।",
          "नमस्ते! आज मैं आपकी कशी मदद कर सकता हूं?",
        ],
        casual_followup: [
          "फिर से नमस्ते! कैसे हैं आप?",
          "हाय! आपसे फिर बात करके अच्छा लगा।",
          "हेलो! पिछली बार से आपका दिन कैसा जा रहा है?",
          "नमस्ते! क्या नया है आपके साथ?",
          "हाय! आज आप कैसा महसूस कर रहे हैं?",
        ],
                 wellness: [
           "तनाव प्रबंधन के लिए, यह 4-7-8 श्वास तकनीक आज़माएं: 4 गिनती तक सांस अंदर लें, 7 तक रोकें, 8 तक छोड़ें। 5 बार दोहराएं। यह आपके पैरासिम्पेथेटिक नर्वस सिस्टम को सक्रिय करता है और तुरंत आराम देता है।",
           "जब अभिभूत महसूस करें, 5-4-3-2-1 ग्राउंडिंग तकनीक आज़माएं: 5 चीज़ें जो आप देखते हैं, 4 जो छू सकते हैं, 3 जो सुनते हैं, 2 जो सूंघते हैं, 1 जो चखते हैं। यह आपको वर्तमान क्षण में वापस लाता है।",
           "तनाव से राहत के लिए, प्रोग्रेसिव मसल रिलैक्सेशन आज़माएं: हर मांसपेशी समूह को 5 सेकंड तक तनाव दें, फिर छोड़ें। पैर की उंगलियों से शुरू करके सिर तक जाएं। यह शारीरिक तनाव मुक्त करता है।",
           "10 मिनट का ब्रेक लें और माइंडफुलनेस का अभ्यास करें: आराम से बैठें, अपनी सांस पर ध्यान केंद्रित करें, और जब विचार आएं, तो धीरे से सांस लेने पर वापस आएं। यह दिमाग साफ करने में मदद करता है।",
           "आंखों के तनाव के लिए 20-20-20 नियम आज़माएं: हर 20 मिनट में, 20 फीट दूर किसी चीज़ को 20 सेकंड तक देखें। यह डिजिटल आंखों के तनाव और मानसिक थकान को कम करता है।"
         ],
        wellness_followup: [
          "मुझे याद है कि तुम्ही आधीही असं वाटत होता. आता तुम्ही याचा सामना कसा करत आहात?",
          "मला हे सांगत राहण्याबद्दल धन्यवाद. मागच्या वेळेपासून गोष्टी कशा आहेत?",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. मागच्या संवादानंतर तुमच्या मनात काय आहे?",
          "मी तुमच्यावर विश्वास ठेवल्याबद्दल आभारी आहे. आता परिस्थितीबद्दल तुम्हाला कसे वाटत आहे?",
          "मी ऐकत आहे आणि तुमच्यासाठी येथे आहे. आता सर्वात उपयुक्त काय असेल?",
        ],
        general: [
          "मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहां हूं। आप क्या बात करना चाहते हैं?",
          "संपर्क करने के लिए धन्यवाद. आज मैं आपकी कशी मदत कर सकता हूं?",
          "मी आपके लिए येथे आहे. आपके मनात काय आहे?",
          "मी ऐकत आहे. मला सांगा की तुम्ही काय अनुभवत आहात.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय चर्चा करायचे आहे?",
        ],
        general_followup: [
          "मी आमचा संवाद सुरू ठेवण्यासाठी येथे आहे. तुम्हाला काय बोलायचे आहे?",
          "पुन्हा संपर्क करने के लिए धन्यवाद. आज मैं आपकी कशी मदत कर सकता हूं?",
          "मी तुमच्यासाठी येथे आहे. मागच्या वेळेपासून तुमच्या मनात काय आहे?",
          "मी ऐकत आहे. मला सांगा की तुम्ही काय अनुभवत आहात.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय चर्चा करायचे आहे?",
        ]
      },
      mr: {
        crisis: [
          "मी तुमचे ऐकत आहे आणि चिंतित आहे. कृपया जाणून घ्या की तुम्ही एकटे नाही आहात आणि असे लोक आहेत जे मदत करू इच्छितात. कृपया त्वरित कोणत्याही संकट हेल्पलाइन किंवा मानसिक आरोग्य व्यावसायिकांशी संपर्क साधा. तुमच्या जीवनाला मूल्य आहे आणि आशा आहे.",
          "तुम्ही जे अनुभवत आहात ते खूप गंभीर वाटते. मी तुम्हाला सांगायचे आहे की मदत 24/7 उपलब्ध आहे. कृपया त्वरित कोणत्याही संकट हेल्पलाइनशी संपर्क साधा किंवा मानसिक आरोग्य व्यावसायिकांशी बोला.",
          "मी ऐकत आहे की तुम्ही आता खूप कठीण काळातून जात आहात. कृपया त्वरित मदतीसाठी पोहोचा - कोणत्याही संकट हेल्पलाइनला कॉल करा किंवा मानसिक आरोग्य व्यावसायिकांशी बोला."
        ],
        general_question: [
          "मी तुमची मदत करण्यात आनंदी असेन! मी तुम्हाला अचूक माहिती प्रदान करतो.",
          "तो एक चांगला प्रश्न आहे! मला त्या विषयाबद्दल जे माहित आहे ते येथे आहे.",
          "मी तुमची मदत करू शकतो! मी तुमच्यासोबत काही उपयुक्त माहिती सामायिक करतो.",
          "तो एक मनोरंजक प्रश्न आहे! मी तुम्हाला त्याबद्दल जे सांगू शकतो ते येथे आहे.",
          "मी तुमची मदत करण्यात आनंदी असेन! मी तुम्हाला काही उपयुक्त माहिती प्रदान करतो."
        ],
        casual: [
          "नमस्कार! आज तुम्हाला कसे वाटत आहे?",
          "हाय! तुमच्याशी बोलून छान वाटले.",
          "हेलो! तुमचा दिवस कसा जात आहे?",
          "नमस्कार! तुमच्या मनात काय आहे?",
          "हाय! मी तुमचे ऐकण्यासाठी आणि तुमचे समर्थन करण्यासाठी येथे आहे.",
          "नमस्कार! आज मी तुमची कशी मदत करू शकतो?",
        ],
        casual_followup: [
          "पुन्हा नमस्कार! तुम्हाला कसे वाटत आहे?",
          "हाय! तुमच्याशी पुन्हा बोलून छान वाटले.",
          "हेलो! मागच्या वेळेपासून तुमचा दिवस कसा जात आहे?",
          "नमस्कार! तुमच्याबद्दल काय नवीन आहे?",
          "हाय! आज तुम्हाला कसे वाटत आहे?",
        ],
                 wellness: [
           "तणाव व्यवस्थापनासाठी, ही 4-7-8 श्वास तंत्र वापरा: 4 मोजणीपर्यंत श्वास घ्या, 7 पर्यंत धरा, 8 पर्यंत सोडा. 5 वेळा पुन्हा करा. हे तुमच्या पॅरासिम्पॅथेटिक नर्व्हस सिस्टमला सक्रिय करते आणि त्वरित आराम देते.",
           "जेव्हा अधिक भार वाटत असेल, 5-4-3-2-1 ग्राउंडिंग तंत्र वापरा: 5 गोष्टी ज्या तुम्ही पाहता, 4 ज्या स्पर्श करू शकता, 3 ज्या ऐकता, 2 ज्या वास घेता, 1 जी चव घेता. हे तुम्हाला वर्तमान क्षणात परत आणते.",
           "तणाव सुटण्यासाठी, प्रोग्रेसिव्ह मसल रिलॅक्सेशन वापरा: प्रत्येक स्नायू गटाला 5 सेकंद ताण द्या, नंतर सोडा. पायाच्या बोटांपासून डोक्यापर्यंत जा. हे शारीरिक तणाव मुक्त करते.",
           "10 मिनिटांचा ब्रेक घ्या आणि माइंडफुलनेस सराव करा: आरामात बसा, तुमच्या श्वासावर लक्ष केंद्रित करा, आणि जेव्हा विचार येतात, तेव्हा हळूवारपणे श्वास घेण्याकडे परत जा. हे मन साफ करण्यास मदत करते.",
           "डोळ्यांच्या तणावासाठी 20-20-20 नियम वापरा: दर 20 मिनिटांनी, 20 फूट दूर असलेल्या एखाद्या गोष्टीकडे 20 सेकंद पहा. हे डिजिटल डोळ्यांचा तणाव आणि मानसिक थकवा कमी करते."
         ],
        wellness_followup: [
          "मला आठवतं की तुम्ही आधीही असं वाटत होता. आता तुम्ही याचा सामना कसा करत आहात?",
          "मला हे सांगत राहण्याबद्दल धन्यवाद. मागच्या वेळेपासून गोष्टी कशा आहेत?",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. मागच्या संवादानंतर तुमच्या मनात काय आहे?",
          "मी तुमच्यावर विश्वास ठेवल्याबद्दल आभारी आहे. आता परिस्थितीबद्दल तुम्हाला कसे वाटत आहे?",
          "मी ऐकत आहे आणि तुमच्यासाठी येथे आहे. आता सर्वात उपयुक्त काय असेल?",
        ],
        general: [
          "मी तुमचे ऐकण्यासाठी आणि तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय बोलायचे आहे?",
          "संपर्क साधल्याबद्दल धन्यवाद. आज मी तुमची कशी मदत करू शकतो?",
          "मी तुमच्यासाठी येथे आहे. तुमच्या मनात काय आहे?",
          "मी ऐकत आहे. मला सांगा की तुम्ही काय अनुभवत आहात.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय चर्चा करायचे आहे?",
        ],
        general_followup: [
          "मी आमचा संवाद सुरू ठेवण्यासाठी येथे आहे. तुम्हाला काय बोलायचे आहे?",
          "पुन्हा संपर्क साधल्याबद्दल धन्यवाद. आज मी तुमची कशी मदत करू शकतो?",
          "मी तुमच्यासाठी येथे आहे. मागच्या वेळेपासून तुमच्या मनात काय आहे?",
          "मी ऐकत आहे. मला सांगा की तुम्ही काय अनुभवत आहात.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय चर्चा करायचे आहे?",
        ]
      }
    };

    let responseType = analysis.type;
    if (analysis.type === 'casual' && isFollowUp) {
      responseType = analysis.type;
    } else if (analysis.type === 'wellness' && isFollowUp) {
      responseType = analysis.type;
    } else if (analysis.type === 'general' && isFollowUp) {
      responseType = analysis.type;
    }

    // Use message content to add some variety to responses
    const messageLength = userMessage.length;
    const messageWords = userMessage.split(' ').length;
    const hasQuestion = userMessage.includes('?') || userMessage.includes('क्या') || userMessage.includes('काय');
    
    // Select response based on message characteristics
    let selectedResponse: string;
    const responses = fallbackResponses[language][responseType];
    
    if (hasQuestion) {
      // For questions, use more helpful responses
      selectedResponse = responses[Math.min(2, responses.length - 1)];
    } else if (messageLength < 10) {
      // For short messages, use casual responses
      selectedResponse = responses[0];
    } else if (messageLength > 50) {
      // For long messages, use more detailed responses
      selectedResponse = responses[Math.min(3, responses.length - 1)];
    } else {
      // For medium messages, use random response
      selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    }

    return {
      text: selectedResponse,
      tokensIn: userMessage.length / 4,
      tokensOut: selectedResponse.length / 4,
      shouldSuggestVideos: shouldSuggestVideos,
    };
  }

  private static isCasualGreeting(message: string): boolean {
    const casualGreetings = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'नमस्ते', 'हाय', 'हेलो', 'सुप्रभात', 'शुभ दोपहर', 'शुभ संध्या',
      'नमस्कार', 'नमस्कार!', 'हाय!', 'हेलो!',
      'how are you', 'how r u', 'what\'s up', 'sup',
      'कैसे हो', 'कैसे हैं आप', 'क्या हाल है',
      'कसे आहात', 'कसे आहेस', 'काय हाल आहे'
    ];
    
    const lowerMessage = message.toLowerCase().trim();
    return casualGreetings.some(greeting => lowerMessage.includes(greeting));
  }

  private static needsWellnessSupport(message: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): boolean {
    const wellnessKeywords = [
      'sad', 'depressed', 'anxious', 'worried', 'stressed', 'overwhelmed', 'lonely', 'hopeless',
      'उदास', 'दुखी', 'चिंतित', 'तनावग्रस्त', 'अकेला', 'निराश', 'परेशान',
      'दुःखी', 'चिंताग्रस्त', 'एकटा', 'निराश', 'परेशान',
      'help', 'support', 'advice', 'counseling', 'therapy', 'mental health',
      'मदद', 'सहायता', 'सलाह', 'परामर्श', 'मानसिक स्वास्थ्य',
      'मदत', 'साहाय्य', 'सल्ला', 'परामर्श', 'मानसिक आरोग्य',
      'cry', 'crying', 'tears', 'pain', 'hurt', 'suffering',
      'रोना', 'दर्द', 'पीड़ा', 'कष्ट',
      'रडणे', 'दुःख', 'वेदना', 'कष्ट'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasWellnessKeywords = wellnessKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Check conversation history for context
    const recentUserMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content.toLowerCase());
    
    const hasWellnessContext = recentUserMessages.some(msg => 
      wellnessKeywords.some(keyword => msg.includes(keyword))
    );
    
    return hasWellnessKeywords || hasWellnessContext;
  }

  static async generateSessionSummary(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    language: 'en' | 'hi' | 'mr'
  ): Promise<string> {
    try {
      if (!hasGeminiKey || !genAI) {
        return this.generateFallbackSummary(messages, language);
      }

      const userMessages = messages.filter(msg => msg.role === 'user');
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');

      const summaryPrompt = `Generate a brief, compassionate summary of this wellness session in ${language === 'hi' ? 'Hindi' : 'English'} (max 200 characters):

User messages: ${userMessages.map(m => m.content).join(' | ')}
Assistant responses: ${assistantMessages.length} supportive responses provided

Focus on:
- Main topics discussed
- Support provided
- Key insights or coping strategies mentioned
- Overall session tone and progress

Keep it warm, encouraging, and culturally sensitive.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(summaryPrompt);
      const response = await result.response;
      const text = response.text();

      return text || this.generateFallbackSummary(messages, language);
    } catch (error) {
      console.error('Error generating session summary:', error);
      return this.generateFallbackSummary(messages, language);
    }
  }

  private static generateFallbackSummary(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    language: 'en' | 'hi' | 'mr'
  ): string {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    const topics = userMessages.map(msg => msg.content.substring(0, 30) + '...');
    
    if (language === 'hi') {
      return `सत्र में ${topics.length} विषयों पर चर्चा हुई। ${assistantMessages.length} सहायक प्रतिक्रियाएं प्रदान की गईं।`;
    } else if (language === 'mr') {
      return `सत्रात ${topics.length} विषयांवर चर्चा झाली. ${assistantMessages.length} सहाय्यक प्रतिसाद दिले गेले.`;
    }
    
    return `Session covered ${topics.length} topics. ${assistantMessages.length} supportive responses provided.`;
  }

  static async detectCrisisContent(message: string): Promise<boolean> {
    try {
      if (!hasGeminiKey || !genAI) {
        return this.detectCrisisKeywords(message);
      }

      const crisisPrompt = `Analyze this message for crisis indicators (suicidal thoughts, self-harm, severe distress). Respond with only "YES" or "NO":

Message: "${message}"

Consider keywords like: suicide, kill myself, want to die, end it all, self harm, hurt myself, no reason to live, better off dead, can't take it anymore`;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(crisisPrompt);
      const response = await result.response;
      const text = response.text();

      const responseText = text?.trim().toUpperCase();
      return responseText === 'YES';
    } catch (error) {
      console.error('Error detecting crisis content:', error);
      // Fallback to keyword detection
      return this.detectCrisisKeywords(message);
    }
  }

  private static detectCrisisKeywords(message: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'want to die', 'end it all',
      'self harm', 'hurt myself', 'no reason to live',
      'better off dead', 'can\'t take it anymore', 'end my life',
      'don\'t want to live', 'life is not worth living'
    ];
    
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}
