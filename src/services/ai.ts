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
  private static systemPrompt = `You are a friendly, culturally aware wellness companion for Indian users. 
You are NOT a doctor, therapist, or medical professional. You should avoid medical diagnosis and treatment recommendations.

Your role is to:
- Provide warm, conversational responses
- Offer emotional support when needed
- Suggest helpful resources only when relevant
- Be culturally sensitive to Indian users
- Keep responses natural and contextual

Guidelines:
- Respond naturally to casual greetings and simple messages
- Only provide wellness advice when the user shares specific concerns
- Keep responses concise and conversational
- Respond in the user's preferred language (English or Hindi)
- If crisis content is detected, provide immediate crisis resources
- Only suggest videos/resources when the user expresses specific needs or concerns

Remember: Be a friendly companion first, wellness guide second.`;

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
        return this.getFallbackResponse(userMessage, language);
      }

      // Analyze if this is a casual greeting or needs wellness support
      const isCasualGreeting = this.isCasualGreeting(userMessage);
      const needsWellnessSupport = this.needsWellnessSupport(userMessage, conversationHistory);
      
      const contextPrompt = isCasualGreeting 
        ? "This appears to be a casual greeting. Respond warmly and naturally, as a friendly companion would."
        : needsWellnessSupport
        ? "The user seems to need emotional support or wellness guidance. Provide appropriate, compassionate help."
        : "Respond naturally to the user's message. Keep it conversational and friendly.";

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Create the full prompt
      const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
      const fullPrompt = `${this.systemPrompt}\n\n${contextPrompt}\n\nRespond in ${languageText}. User's name: ${userName}\n\nUser message: ${userMessage}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Estimate token usage (Gemini doesn't provide exact token counts in the same way)
      const estimatedTokensIn = fullPrompt.length / 4;
      const estimatedTokensOut = text.length / 4;

      return {
        text: text || this.getFallbackResponse(userMessage, language).text,
        tokensIn: estimatedTokensIn,
        tokensOut: estimatedTokensOut,
        shouldSuggestVideos: needsWellnessSupport && !isCasualGreeting,
      };
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      return this.getFallbackResponse(userMessage, language);
    }
  }

  private static getFallbackResponse(userMessage: string, language: 'en' | 'hi' | 'mr'): AIResponse {
    // Analyze if this is a casual greeting or needs wellness support
    const isCasualGreeting = this.isCasualGreeting(userMessage);
    const needsWellnessSupport = this.needsWellnessSupport(userMessage, []);
    
    // More dynamic fallback responses based on message content
    const fallbackResponses: Record<string, Record<string, string[]>> = {
      en: {
        casual: [
          "Hello! How are you doing today?",
          "Hi there! Nice to chat with you.",
          "Hey! How's your day going?",
          "Hello! What's on your mind?",
          "Hi! I'm here to listen and support you.",
          "Hello! How can I help you today?",
        ],
        wellness: [
          "I hear you, and I want you to know that your feelings are valid. Let's take a moment to breathe together - inhale for 4 counts, hold for 4, exhale for 6. This simple practice can help ground you in the present moment.",
          "Thank you for sharing that with me. It's completely normal to feel this way. Consider talking to someone you trust, or if these feelings persist, reaching out to a mental health professional could be very helpful.",
          "I understand this is difficult. Remember, you don't have to face this alone. There are people who care and want to help. Would you like to explore some coping strategies together?",
          "Your feelings matter, and it's okay to not be okay. Let's work through this together. What would be most helpful for you right now?",
          "I appreciate you opening up to me. What would be most helpful for you right now?",
        ],
        general: [
          "I'm here to listen and support you. What would you like to talk about?",
          "Thank you for reaching out. How can I help you today?",
          "I'm here for you. What's on your mind?",
          "I'm listening. Tell me more about what you're going through.",
          "I'm here to support you. What would you like to discuss?",
        ]
      },
      hi: {
        casual: [
          "नमस्ते! आज आप कैसे हैं?",
          "हाय! आपसे बात करके अच्छा लगा।",
          "हेलो! आपका दिन कैसा जा रहा है?",
          "नमस्ते! आपके मन में क्या है?",
          "हाय! मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहां हूं।",
          "नमस्ते! आज मैं आपकी कशी मदद कर सकता हूं?",
        ],
        wellness: [
          "मैं आपकी बात सुन रहा हूं और लगता है कि आप एक कठिन समय से गुजर रहे हैं। चलिए एक साथ सांस लेते हैं - 4 गिनती तक सांस अंदर लें, 4 तक रोकें, 6 तक छोड़ें। यह सरल अभ्यास आपको वर्तमान क्षण में जमीन पर लाने में मदद कर सकता है।",
          "मुझे यह बताने के लिए धन्यवाद। इस तरह महसूस करना पूरी तरह सामान्य है। किसी भरोसेमंद व्यक्ति से बात करने पर विचार करें, या अगर ये भावनाएं बनी रहती हैं, तो मानसिक स्वास्थ्य पेशेवर से संपर्क करना बहुत मददगार हो सकता है।",
          "मैं समझता हूं कि यह मुश्किल है। याद रखें, आपको इसका सामना अकेले नहीं करना है। ऐसे लोग हैं जो परवाह करते हैं और मदद करना चाहते हैं। क्या आप कुछ सामना करने की रणनीतियों का पता लगाना चाहेंगे?",
          "आपकी भावनाएं महत्वपूर्ण हैं, और बरे नसणेही ठीक आहे. चला हे एकत्र सोडवू. आता तुमच्यासाठी सर्वात उपयुक्त काय असेल?",
          "मला हे सांगण्याबद्दल धन्यवाद. आता तुमच्यासाठी सर्वात उपयुक्त काय असेल?",
        ],
        general: [
          "मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहां हूं। आप क्या बात करना चाहते हैं?",
          "संपर्क करने के लिए धन्यवाद. आज मैं आपकी कशी मदत कर सकता हूं?",
          "मी आपके लिए येथे आहे. आपके मनात काय आहे?",
          "मी ऐकत आहे. मला सांगा की तुम्ही काय अनुभवत आहात.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय चर्चा करायचे आहे?",
        ]
      },
      mr: {
        casual: [
          "नमस्कार! आज तुम्हाला कसे वाटत आहे?",
          "हाय! तुमच्याशी बोलून छान वाटले.",
          "हेलो! तुमचा दिवस कसा जात आहे?",
          "नमस्कार! तुमच्या मनात काय आहे?",
          "हाय! मी तुमचे ऐकण्यासाठी आणि तुमचे समर्थन करण्यासाठी येथे आहे.",
          "नमस्कार! आज मी तुमची कशी मदत करू शकतो?",
        ],
        wellness: [
          "मी तुमचे ऐकत आहे आणि तुम्हाला सांगायचे आहे की तुमच्या भावना योग्य आहेत. चला एकत्र श्वास घेऊ - 4 मोजणीपर्यंत श्वास घ्या, 4 पर्यंत धरा, 6 पर्यंत सोडा. हा सोपा सराव तुम्हाला वर्तमान क्षणात जमिनीवर आणण्यास मदत करू शकतो.",
          "मला हे सांगण्याबद्दल धन्यवाद. अशा प्रकारे वाटणे पूर्णपणे सामान्य आहे. तुमच्या विश्वासातील एखाद्याशी बोलण्याचा विचार करा, किंवा जर हे भावना टिकून राहत असतील तर मानसिक आरोग्य व्यावसायिकांशी संपर्क साधणे खूप उपयुक्त ठरू शकते.",
          "मी समजतो की हे कठीण आहे. लक्षात ठेवा, तुम्हाला याचा सामना एकट्याने करण्याची गरज नाही. असे लोक आहेत जे काळजी घेतात आणि मदत करू इच्छितात. तुम्हाला काही सामना करण्याच्या रणनीती एकत्र शोधायच्या आहेत का?",
          "तुमच्या भावना महत्त्वाच्या आहेत, आणि बरे नसणेही ठीक आहे. चला हे एकत्र सोडवू. आता तुमच्यासाठी सर्वात उपयुक्त काय असेल?",
          "मला हे सांगण्याबद्दल धन्यवाद. आता तुमच्यासाठी सर्वात उपयुक्त काय असेल?",
        ],
        general: [
          "मी तुमचे ऐकण्यासाठी आणि तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय बोलायचे आहे?",
          "संपर्क साधल्याबद्दल धन्यवाद. आज मी तुमची कशी मदत करू शकतो?",
          "मी तुमच्यासाठी येथे आहे. तुमच्या मनात काय आहे?",
          "मी ऐकत आहे. मला सांगा की तुम्ही काय अनुभवत आहात.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. तुम्हाला काय चर्चा करायचे आहे?",
        ]
      }
    };

    let responseType = 'general';
    if (isCasualGreeting) {
      responseType = 'casual';
    } else if (needsWellnessSupport) {
      responseType = 'wellness';
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
      shouldSuggestVideos: needsWellnessSupport && !isCasualGreeting,
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
