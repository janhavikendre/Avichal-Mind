import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private chat: any = null;

  constructor() {
    this.initializeChat();
  }

  private initializeChat() {
    this.chat = this.model.startChat({
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async generateResponse(userMessage: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<string> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY not found, using fallback response');
        return this.getFallbackResponse(language);
      }

      const systemPrompt = this.getSystemPrompt(language);
      
      // Send system prompt first
      await this.chat.sendMessage(systemPrompt);
      
      // Send user message
      const result = await this.chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      return text || this.getFallbackResponse(language);
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      return this.getFallbackResponse(language);
    }
  }

  private getSystemPrompt(language: 'en' | 'hi' | 'mr'): string {
    const basePrompt = `You are a compassionate, culturally aware wellness guide for Indian users. You are not a doctor and should avoid medical diagnosis. 

Your role is to:
- Offer empathetic listening and emotional support
- Provide grounding techniques and breathing exercises
- Suggest CBT-inspired coping strategies
- Encourage professional help for severe distress
- Maintain cultural sensitivity for Indian users
- Keep responses concise (2-3 sentences) and actionable
- Never give medical advice or diagnose conditions

    ${language === 'hi' ? 'Respond in Hindi with cultural sensitivity.' : language === 'mr' ? 'Respond in Marathi with cultural sensitivity.' : 'Respond in English with cultural sensitivity.'}

If you detect crisis content (suicide, self-harm, etc.), acknowledge the concern and provide crisis resources.`;

    return basePrompt;
  }

  private getFallbackResponse(language: 'en' | 'hi' | 'mr'): string {
    const responses = {
      en: [
        "I understand you're going through a difficult time. It's important to acknowledge your feelings.",
        "Thank you for sharing that with me. How are you feeling right now?",
        "I hear you, and I want you to know that your feelings are valid.",
        "That sounds really challenging. Can you tell me more about what's been happening?",
        "I appreciate you opening up to me. What would be most helpful for you right now?"
      ],
      hi: [
        "मैं समझता हूं कि आप एक कठिन समय से गुजर रहे हैं। अपनी भावनाओं को स्वीकार करना महत्वपूर्ण है।",
        "मुझे यह बताने के लिए धन्यवाद। अभी आप कैसा महसूस कर रहे हैं?",
        "मैं आपकी बात सुन रहा हूं, और मैं चाहता हूं कि आप जानें कि आपकी भावनाएं वैध हैं।",
        "यह वाकई चुनौतीपूर्ण लगता है। क्या आप मुझे और बता सकते हैं कि क्या हो रहा है?",
        "मुझे आपके साथ खुलने के लिए धन्यवाद। अभी आपके लिए सबसे ज्यादा मददगार क्या होगा?"
      ],
      mr: [
        "मी तुमच्या काळजीला जाणतो. तुम्ही एक कठीण काळातून जात आहात. तुमच्या भावना मान्य करणे महत्वाचे आहे.",
        "मला हे सांगण्याबद्दल धन्यवाद. आता तुम्हाला कसे वाटत आहे?",
        "मी तुमचे ऐकत आहे, आणि मला तुम्हाला सांगायचे आहे की तुमच्या भावना योग्य आहेत.",
        "हे खरोखर आव्हानात्मक वाटते. तुम्ही मला आणखी काय होत आहे ते सांगू शकता का?",
        "तुम्ही माझ्याशी खुलल्याबद्दल धन्यवाद. आता तुमच्यासाठी सर्वात उपयुक्त काय असेल?"
      ]
    };

    const langResponses = responses[language] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
  }

  async detectCrisisContent(message: string): Promise<boolean> {
    const crisisKeywords = [
      'suicide', 'kill myself', 'want to die', 'end it all', 'no reason to live',
      'self harm', 'hurt myself', 'better off dead', 'no point living',
      'आत्महत्या', 'खुद को मार डालूंगा', 'मरना चाहता हूं', 'जीने का कोई मतलब नहीं',
      'आत्महत्या', 'मी माझा जीव घेईन', 'मरणे इच्छित आहे', 'जगण्याचा काही अर्थ नाही'
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export const geminiService = new GeminiService();
