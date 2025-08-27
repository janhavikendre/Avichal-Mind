import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  audioUrl?: string;
}

export class AIService {
  private static systemPrompt = `You are a compassionate, culturally aware wellness guide for Indian users. 
You are NOT a doctor, therapist, or medical professional. You should avoid medical diagnosis and treatment recommendations.

Your role is to provide:
- Emotional support and validation
- Grounding techniques and breathing exercises
- CBT-inspired coping strategies
- Encouragement to seek professional help when appropriate
- Cultural sensitivity to Indian family dynamics and societal pressures

Guidelines:
- Keep responses concise (2-3 sentences)
- Be warm, non-judgmental, and culturally sensitive
- Respond in the user's preferred language (English or Hindi)
- If crisis content is detected, provide immediate crisis resources
- Encourage professional help for severe distress
- Focus on practical, actionable advice

Remember: You are a wellness companion, not a replacement for professional mental health care.`;

  static async generateResponse(
    userMessage: string,
    language: 'en' | 'hi',
    userName: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AIResponse> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: this.systemPrompt + `\n\nRespond in ${language === 'hi' ? 'Hindi' : 'English'}. User's name: ${userName}`
        },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 200,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;

      return {
        text: response,
        tokensIn: usage?.prompt_tokens || 0,
        tokensOut: usage?.completion_tokens || 0,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback responses
      const fallbackResponses = {
        en: [
          "I hear you, and I want you to know that your feelings are valid. Let's take a moment to breathe together - inhale for 4 counts, hold for 4, exhale for 6. This simple practice can help ground you in the present moment.",
          "Thank you for sharing that with me. It's completely normal to feel this way. Consider talking to someone you trust, or if these feelings persist, reaching out to a mental health professional could be very helpful.",
          "I understand this is difficult. Remember, you don't have to face this alone. There are people who care and want to help. Would you like to explore some coping strategies together?",
        ],
        hi: [
          "मैं आपकी बात सुन रहा हूं और लगता है कि आप एक कठिन समय से गुजर रहे हैं। चलिए एक साथ सांस लेते हैं - 4 गिनती तक सांस अंदर लें, 4 तक रोकें, 6 तक छोड़ें। यह सरल अभ्यास आपको वर्तमान क्षण में जमीन पर लाने में मदद कर सकता है।",
          "मुझे यह बताने के लिए धन्यवाद। इस तरह महसूस करना पूरी तरह सामान्य है। किसी भरोसेमंद व्यक्ति से बात करने पर विचार करें, या अगर ये भावनाएं बनी रहती हैं, तो मानसिक स्वास्थ्य पेशेवर से संपर्क करना बहुत मददगार हो सकता है।",
          "मैं समझता हूं कि यह मुश्किल है। याद रखें, आपको इसका सामना अकेले नहीं करना है। ऐसे लोग हैं जो परवाह करते हैं और मदद करना चाहते हैं। क्या आप कुछ सामना करने की रणनीतियों का पता लगाना चाहेंगे?",
        ],
      };

      const randomResponse = fallbackResponses[language][
        Math.floor(Math.random() * fallbackResponses[language].length)
      ];

      return {
        text: randomResponse,
        tokensIn: userMessage.length / 4,
        tokensOut: randomResponse.length / 4,
      };
    }
  }

  static async generateSessionSummary(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    language: 'en' | 'hi'
  ): Promise<string> {
    try {
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 150,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content || this.generateFallbackSummary(messages, language);
    } catch (error) {
      console.error('Error generating session summary:', error);
      return this.generateFallbackSummary(messages, language);
    }
  }

  private static generateFallbackSummary(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    language: 'en' | 'hi'
  ): string {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    const topics = userMessages.map(msg => msg.content.substring(0, 30) + '...');
    
    if (language === 'hi') {
      return `सत्र में ${topics.length} विषयों पर चर्चा हुई। ${assistantMessages.length} सहायक प्रतिक्रियाएं प्रदान की गईं।`;
    }
    
    return `Session covered ${topics.length} topics. ${assistantMessages.length} supportive responses provided.`;
  }

  static async detectCrisisContent(message: string): Promise<boolean> {
    try {
      const crisisPrompt = `Analyze this message for crisis indicators (suicidal thoughts, self-harm, severe distress). Respond with only "YES" or "NO":

Message: "${message}"

Consider keywords like: suicide, kill myself, want to die, end it all, self harm, hurt myself, no reason to live, better off dead, can't take it anymore`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: crisisPrompt }],
        max_tokens: 10,
        temperature: 0,
      });

      const response = completion.choices[0]?.message?.content?.trim().toUpperCase();
      return response === 'YES';
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
