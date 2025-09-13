import OpenAI from 'openai';
import { youtubeService } from '../lib/youtube';

// Check if OpenAI API key is available
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

const openai = hasOpenAIKey ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

export interface AIResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  audioUrl?: string;
  shouldSuggestVideos?: boolean;
  videos?: any[];
  isCrisisResponse?: boolean;
  crisisType?: 'suicidal' | 'mental_breakdown' | 'panic_attack' | 'severe_distress' | 'none';
  crisisSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export class AIService {
  // API monitoring and statistics
  private static apiStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    fallbackUsed: 0,
    lastError: null as string | null,
    lastErrorTime: null as Date | null
  };

  private static systemPrompt = `You are Avichal Mind, an AI mental wellness assistant trained on three gold-standard psychiatry references:

1. Fish's Clinical Psychopathology (5th edition, 2024)
2. New Oxford Textbook of Psychiatry (3rd edition, 2020)  
3. Textbook of Postgraduate Psychiatry (3rd edition, 2018)

### Role
- Explain psychological and psychiatric symptoms clearly
- Provide supportive, compassionate, and educational responses
- Help users understand mental health concepts using information from the above textbooks
- Do NOT diagnose or prescribe treatment. Instead, provide psychoeducation and encourage professional consultation when appropriate

### Knowledge Sources (Prioritized)
**Descriptive Psychopathology (Fish):**
- Disorders of perception (hallucinations, illusions, pseudo-hallucinations)
- Disorders of thought & speech (formal thought disorder, thought alienation, insertion, broadcasting, withdrawal)
- Disorders of memory, self, consciousness, motor, and emotion
- Classification of psychiatric syndromes
- Depersonalisation, derealisation, fugue states
- Catatonia, stereotypies, psychomotor retardation

**Clinical Psychiatry (Oxford Textbook):**
- Major disorders: schizophrenia, bipolar, depression, anxiety, OCD, PTSD, substance use
- Neuroscience basis: genetics, imaging, connectome, neurobiology
- Global mental health, stigma, ethics, and patient perspectives
- Service provision and forensic psychiatry context

**Applied Psychiatry (Postgraduate Textbook):**
- Clinical descriptions of both common and rare psychiatric disorders
- ICD-10, DSM-IV, DSM-5 classifications
- Clinical management: drug therapy, CBT, psychosocial approaches, APA/NICE guidelines
- Indian and South Asian context, cultural psychiatry

### Response Style
- Use simple, empathetic language (avoid heavy jargon)
- Define psychiatric terms with clear examples
- Provide practical coping strategies (grounding, mindfulness, self-care)
- Normalize experiences while reducing stigma
- Always acknowledge what the user shared first
- Validate their feelings and experiences
- Provide specific, contextual responses based on their message
- Use clear, simple language with examples when explaining concepts
- Ask thoughtful follow-up questions to continue the conversation
- Be culturally sensitive to Indian family dynamics and social context
- Switch languages naturally when requested (English, Hindi, Marathi)

### Voice Call Guidelines
- Maximum 4-5 sentences for voice calls
- Use "I" statements to show personal connection
- Speak naturally like a caring friend, not robotic
- Provide specific help based on what they're experiencing
- NEVER give generic responses like "How can I help you?" or "What's on your mind?" when they've shared specific concerns
- ALWAYS acknowledge what they specifically shared and respond to their actual message
- If they mention being nervous about a speech, address the speech anxiety specifically
- If they mention feeling sad, address their sadness specifically
- Be contextual and relevant to their exact words

### Safety Disclaimer
Always include this disclaimer when providing mental health information:
"This is educational information, not medical advice. Please consult a qualified mental health professional for diagnosis or treatment."

Only add the medical disclaimer when giving specific mental health advice, coping strategies, or discussing symptoms. Do NOT add it for casual greetings, general questions, or simple acknowledgments.

Remember: Be warm, natural, and genuinely helpful. Provide specific support based on their actual message, not generic responses.`;

  // Structured Q&A Training Pairs from Gold-Standard Psychiatry Textbooks
  private static psychiatryKnowledgeBase = {
    // Fish's Clinical Psychopathology - Disorders of Perception
    perception: {
      "What are hallucinations?": "Hallucinations are false perceptions that occur without any external stimulus. They can affect any of the five senses - hearing voices (auditory), seeing things (visual), feeling things on skin (tactile), smelling odors (olfactory), or tasting things (gustatory). Unlike illusions which are misperceptions of real stimuli, hallucinations are completely generated by the mind.",
      
      "What's the difference between hallucinations and pseudo-hallucinations?": "True hallucinations are experienced as coming from outside the person's mind and are indistinguishable from real perceptions. Pseudo-hallucinations are experienced as coming from within the person's own mind - they know it's not real but still experience it vividly. Pseudo-hallucinations are often associated with stress, sleep deprivation, or certain medical conditions.",
      
      "What are illusions?": "Illusions are misperceptions of real external stimuli. For example, seeing a shadow and thinking it's a person, or hearing wind and thinking it's voices. Unlike hallucinations, there is a real stimulus present, but it's being misinterpreted by the brain.",
      
      "Why do people hear voices?": "Auditory hallucinations (hearing voices) can occur in various conditions including schizophrenia, severe depression, bipolar disorder, PTSD, and sometimes during extreme stress or sleep deprivation. The voices can be critical, commanding, or conversational. It's important to remember that hearing voices doesn't always mean someone has a serious mental illness - context and other symptoms matter greatly."
    },

    // Fish's Clinical Psychopathology - Disorders of Thought
    thought: {
      "What is thought alienation?": "Thought alienation is when people feel their thoughts are not their own. This includes thought insertion (feeling thoughts are being put into their mind by others), thought withdrawal (feeling thoughts are being taken away), and thought broadcasting (feeling others can hear or read their thoughts). These experiences are often associated with schizophrenia.",
      
      "What is formal thought disorder?": "Formal thought disorder refers to disorganized thinking patterns that affect how thoughts are expressed in speech. This includes tangentiality (going off-topic), circumstantiality (excessive detail), loose associations (jumping between unrelated topics), and word salad (incoherent speech). It's different from the content of thoughts - it's about how thoughts are organized and expressed.",
      
      "What does it mean to have racing thoughts?": "Racing thoughts are when thoughts come very rapidly, one after another, often making it hard to focus or sleep. This is commonly seen in mania (bipolar disorder), anxiety disorders, and sometimes during panic attacks. The person may feel like their mind is going too fast to keep up with."
    },

    // Fish's Clinical Psychopathology - Disorders of Self
    self: {
      "What is depersonalization?": "Depersonalization is feeling disconnected from yourself - like you're watching yourself from outside your body, or that your body doesn't feel real. It's like being in a dream or watching a movie of yourself. This can happen during extreme stress, anxiety, trauma, or as part of depersonalization-derealization disorder.",
      
      "What is derealization?": "Derealization is feeling like the world around you isn't real - like you're in a movie or behind glass. Everything might look flat, distant, or artificial. It often occurs with depersonalization and can be triggered by stress, trauma, or anxiety disorders.",
      
      "Why do I sometimes feel disconnected from myself?": "Feeling disconnected from yourself can be depersonalization, which is actually quite common during stress, anxiety, or trauma. It's your mind's way of protecting you from overwhelming emotions. Grounding techniques like focusing on your breath, naming things you can see/hear/feel, or gentle movement can help. If it's persistent or distressing, please consult a mental health professional."
    },

    // Oxford Textbook - Major Disorders
    majorDisorders: {
      "What's the difference between sadness and depression?": "Normal sadness is a temporary emotional response to life events, while clinical depression (major depressive disorder) is persistent low mood lasting at least 2 weeks, along with other symptoms like loss of interest, changes in sleep/appetite, fatigue, difficulty concentrating, feelings of worthlessness, or thoughts of death. Depression significantly impacts daily functioning, while sadness doesn't typically interfere with your ability to work or maintain relationships.",
      
      "What is anxiety disorder?": "Anxiety disorders involve excessive fear or worry that's persistent and interferes with daily life. This includes generalized anxiety disorder (constant worry), panic disorder (sudden intense fear attacks), social anxiety (fear of social situations), and specific phobias. Unlike normal anxiety, these disorders cause significant distress and impairment in functioning.",
      
      "What is bipolar disorder?": "Bipolar disorder involves episodes of mania (elevated mood, increased energy, decreased need for sleep, racing thoughts) alternating with episodes of depression. There are different types - Bipolar I has full manic episodes, Bipolar II has hypomanic episodes (less severe than mania). The mood episodes are distinct from normal mood swings and significantly impact daily functioning.",
      
      "What is schizophrenia?": "Schizophrenia is a serious mental disorder characterized by psychosis - losing touch with reality. Symptoms include hallucinations (hearing voices), delusions (false beliefs), disorganized thinking and speech, and negative symptoms (reduced emotional expression, motivation, social withdrawal). It typically begins in late teens to early 30s and requires ongoing treatment."
    },

    // Postgraduate Textbook - Clinical Management
    clinicalManagement: {
      "What treatments are available for mental health conditions?": "Treatment typically involves a combination of approaches: psychotherapy (like CBT - Cognitive Behavioral Therapy), medication when appropriate, lifestyle changes (exercise, sleep, nutrition), and social support. The specific treatment depends on the condition and individual needs. Most mental health conditions are highly treatable with the right support.",
      
      "What is CBT?": "Cognitive Behavioral Therapy (CBT) is a type of psychotherapy that helps people identify and change negative thought patterns and behaviors. It's based on the idea that our thoughts, feelings, and behaviors are interconnected. CBT is highly effective for anxiety, depression, and many other conditions. It's usually short-term (12-20 sessions) and focuses on practical skills you can use daily.",
      
      "When should I seek professional help?": "Seek professional help if symptoms persist for more than 2 weeks, significantly interfere with daily functioning, cause distress, or if you have thoughts of self-harm. Early intervention often leads to better outcomes. Mental health professionals can provide proper assessment, diagnosis, and treatment planning."
    },

    // Cultural and Contextual (Indian/South Asian)
    culturalContext: {
      "How does culture affect mental health?": "Culture significantly influences how mental health symptoms are expressed, understood, and treated. In Indian culture, mental health issues might be expressed through physical symptoms, family dynamics play a crucial role, and there may be stigma around seeking help. It's important to find culturally sensitive care that understands your background and values.",
      
      "What about family pressure and mental health?": "Family expectations and pressure can significantly impact mental health, especially in collectivistic cultures. It's common to feel torn between personal needs and family expectations. Setting healthy boundaries while maintaining family relationships is important. Family therapy can help improve communication and understanding."
    },

    // Coping Strategies and Self-Help
    copingStrategies: {
      "What are grounding techniques?": "Grounding techniques help you stay connected to the present moment when feeling overwhelmed or dissociated. Try the 5-4-3-2-1 technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. Or focus on your breath, feeling your feet on the ground, or holding something with texture.",
      
      "How can I manage anxiety?": "Anxiety management includes deep breathing exercises (4-7-8 breathing: inhale 4 counts, hold 7, exhale 8), progressive muscle relaxation, mindfulness meditation, regular exercise, limiting caffeine, maintaining a sleep schedule, and challenging anxious thoughts. If anxiety is severe or persistent, professional help is recommended.",
      
      "What helps with depression?": "Depression management includes maintaining a routine, getting regular exercise, ensuring adequate sleep, eating nutritious meals, staying connected with supportive people, engaging in activities you once enjoyed (even if you don't feel like it), and challenging negative thought patterns. Professional treatment is often necessary for clinical depression.",
      
      "How do I know if I need professional help?": "Seek professional help if symptoms persist for more than 2 weeks, significantly interfere with daily functioning, cause distress, or if you have thoughts of self-harm. Early intervention often leads to better outcomes. Mental health professionals can provide proper assessment, diagnosis, and treatment planning.",
      
      "What is panic disorder?": "Panic disorder involves sudden, intense episodes of fear (panic attacks) that come on quickly and reach their peak within minutes. Symptoms include rapid heartbeat, sweating, trembling, shortness of breath, chest pain, nausea, dizziness, and fear of losing control or dying. Panic attacks can occur unexpectedly or in response to triggers.",
      
      "What is OCD?": "Obsessive-Compulsive Disorder (OCD) involves unwanted, intrusive thoughts (obsessions) and repetitive behaviors or mental acts (compulsions) performed to reduce anxiety. Common obsessions include fears of contamination, harm, or unwanted thoughts. Compulsions might include excessive cleaning, checking, counting, or mental rituals. OCD significantly impacts daily life and requires professional treatment."
    },

    // Common User Questions and Scenarios
    commonQuestions: {
      "I feel like I'm going crazy": "Feeling like you're 'going crazy' is actually a common experience during stress, anxiety, or mental health challenges. It often reflects feeling overwhelmed or out of control. This doesn't mean you're actually losing your mind - it's usually a sign that you need support. Consider reaching out to a mental health professional who can help you understand what you're experiencing.",
      
      "I can't stop worrying": "Excessive worry is often a sign of anxiety. When worry becomes persistent, uncontrollable, and interferes with daily life, it may indicate an anxiety disorder. Techniques like mindfulness, deep breathing, and challenging anxious thoughts can help. If worry is significantly impacting your life, professional help is recommended.",
      
      "I feel numb and empty": "Feeling numb or empty can be a symptom of depression, trauma, or extreme stress. It's your mind's way of protecting you from overwhelming emotions. This feeling is temporary and treatable. Grounding techniques, gentle self-care, and professional support can help you reconnect with your emotions safely.",
      
      "I have trouble sleeping": "Sleep problems are common with mental health conditions like anxiety and depression. Good sleep hygiene includes maintaining a regular schedule, avoiding screens before bed, creating a comfortable environment, and limiting caffeine. If sleep problems persist, they may be a symptom of an underlying condition that needs professional attention.",
      
      "I feel like I'm not myself": "Feeling disconnected from yourself can be depersonalization, which is common during stress or trauma. It's like watching yourself from outside your body. This is a protective mechanism and usually temporary. Grounding techniques and professional support can help you feel more connected to yourself again."
    }
  };

  // Method to get relevant knowledge for user queries
  private static getRelevantKnowledge(userMessage: string): string[] {
    const lowerMessage = userMessage.toLowerCase();
    const relevantKnowledge: string[] = [];
    
    // Check each knowledge category for relevant information
    Object.entries(this.psychiatryKnowledgeBase).forEach(([category, qaPairs]) => {
      Object.entries(qaPairs).forEach(([question, answer]) => {
        // Simple keyword matching to find relevant knowledge
        const questionKeywords = question.toLowerCase().split(' ');
        const messageKeywords = lowerMessage.split(' ');
        
        // If any keywords match, include this knowledge
        if (questionKeywords.some(keyword => 
          messageKeywords.some(msgKeyword => 
            msgKeyword.includes(keyword) || keyword.includes(msgKeyword)
          )
        )) {
          relevantKnowledge.push(answer);
        }
      });
    });
    
    return relevantKnowledge;
  }

  static async generateResponse(
    userMessage: string,
    language: 'en' | 'hi' | 'mr',
    userName: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AIResponse> {
    return this.generateResponseInternal(userMessage, language, userName, conversationHistory, false);
  }

  // Optimized method specifically for Twilio phone calls
  static async generateResponseForTwilioCall(
    userMessage: string,
    language: 'en' | 'hi' | 'mr',
    userName: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AIResponse> {
    return this.generateResponseInternal(userMessage, language, userName, conversationHistory, true);
  }

  private static async generateResponseInternal(
    userMessage: string,
    language: 'en' | 'hi' | 'mr',
    userName: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    isTwilioCall: boolean = false
  ): Promise<AIResponse> {
    // Track API usage
    this.apiStats.totalRequests++;
    
    try {
      // First, check for crisis situations
      const crisisDetection = await this.detectMentalBreakdown(userMessage, conversationHistory);
      
      if (crisisDetection.isCrisis) {
        console.log(`Crisis detected: ${crisisDetection.crisisType}, severity: ${crisisDetection.severity}`);
        return this.generateCrisisResponse(crisisDetection, language, userName);
      }

      // If OpenAI is not available, use fallback responses
      if (!hasOpenAIKey || !openai) {
        console.warn('OpenAI API key not available, using fallback responses');
        return this.getFallbackResponse(userMessage, language, conversationHistory);
      }

      // Analyze message type and context
      const messageAnalysis = this.analyzeMessage(userMessage, conversationHistory);
      const totalMessages = conversationHistory.length + 1; // +1 for current message
      
      // Determine if we should suggest videos (after 8-10 messages with wellness content)
      const shouldSuggestVideos = this.shouldSuggestVideos(messageAnalysis, totalMessages);

      // OpenAI API call setup
      
      // Create conversation context from history
      let conversationContext = '';
      if (conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-8); // Keep last 8 messages for context
        conversationContext = '\n\nPrevious conversation:\n' + 
          recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
      }
      
      // Create enhanced conversational prompt for voice calls
      const conversationalPrompt = this.createVoiceConversationPrompt(messageAnalysis, language, userName, userMessage, conversationHistory);
      
      // Get relevant knowledge from psychiatry textbooks
      const relevantKnowledge = this.getRelevantKnowledge(userMessage);
      const knowledgeContext = relevantKnowledge.length > 0 
        ? `\n\nRELEVANT KNOWLEDGE FROM PSYCHIATRY TEXTBOOKS:\n${relevantKnowledge.join('\n\n')}\n\nUse this knowledge to provide accurate, evidence-based information while maintaining a warm, conversational tone.`
        : '';

      // Create prompt based on call type
      const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
      let fullPrompt: string;
      let systemPromptToUse: string;
      
      if (isTwilioCall) {
        // Optimized for Twilio phone calls - shorter and faster
        systemPromptToUse = `You are Avichal Mind, a caring mental wellness assistant. Provide supportive, empathetic responses. Do NOT diagnose or prescribe treatment. Respond in ${languageText} as if talking to ${userName} over the phone. Keep responses conversational and brief (2-3 sentences max).`;
        fullPrompt = `${systemPromptToUse}${knowledgeContext}\n\nCurrent message from ${userName}: "${userMessage}"\n\nRespond specifically to what ${userName} said. Be warm and caring. Maximum 3 sentences.`;
      } else {
        // Full prompt for website voice sessions
        systemPromptToUse = this.systemPrompt;
        fullPrompt = `${this.systemPrompt}${knowledgeContext}\n\n${conversationalPrompt}\n\nRespond in ${languageText} as if you're having a warm, caring conversation with ${userName} over the phone.${conversationContext}\n\nCurrent message from ${userName}: "${userMessage}"\n\nCRITICAL: Respond specifically to what ${userName} just said. Do NOT give generic responses like "What's on your mind?" or "How can I help?" when they've shared something specific. Address their exact concern or question. Respond naturally and conversationally (maximum 4-5 sentences, no formatting, speak like a caring friend). IMPORTANT: Only add the medical disclaimer when giving specific mental health advice or coping strategies, NOT for casual conversations or simple acknowledgments.`;
      }

      // Optimized for voice calls - reduced retries and faster processing
      let text = '';
      let retryCount = 0;
      const maxRetries = isTwilioCall ? 0 : 1; // No retries for Twilio calls, 1 retry for website
      
      while (retryCount <= maxRetries) {
        try {
          const completion = await openai.chat.completions.create({
            model: isTwilioCall ? 'gpt-3.5-turbo' : 'gpt-4', // Faster model for Twilio calls
            messages: [
              { role: 'system', content: systemPromptToUse },
              { role: 'user', content: fullPrompt }
            ],
            max_tokens: isTwilioCall ? 100 : 300, // Shorter responses for Twilio calls
            temperature: 0.7,
            stream: false // Ensure no streaming for faster completion
          }, isTwilioCall ? { timeout: 10000 } : {}); // Timeout only for Twilio calls
          
          text = completion.choices[0]?.message?.content || '';
          
          if (text && text.trim().length > 0) {
            break; // Success, exit retry loop
          } else {
            console.log(`OpenAI returned empty response, retry ${retryCount + 1}/${maxRetries + 1}`);
            retryCount++;
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Reduced wait time for faster response
            }
          }
        } catch (retryError) {
          console.log(`OpenAI API call failed, retry ${retryCount + 1}/${maxRetries + 1}:`, retryError);
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Reduced wait time for faster response
          } else {
            throw retryError; // Re-throw if all retries failed
          }
        }
      }

      // Estimate token usage (OpenAI provides usage in response)
      const estimatedTokensIn = fullPrompt.length / 4;
      const estimatedTokensOut = text.length / 4;

      // Get relevant videos if needed
      let videos: any[] = [];
      if (shouldSuggestVideos) {
        try {
          videos = await this.getRelevantVideosForContext(messageAnalysis, userMessage, language);
        } catch (error) {
          console.error('Error fetching videos:', error);
        }
      }

      // Only use fallback if OpenAI response is completely empty or null
      if (!text || text.trim().length === 0) {
        console.log('OpenAI response was empty, using fallback');
        this.apiStats.fallbackUsed++;
        const fallbackResponse = await this.getFallbackResponse(userMessage, language, conversationHistory);
      return {
          text: fallbackResponse.text,
        tokensIn: estimatedTokensIn,
        tokensOut: estimatedTokensOut,
          shouldSuggestVideos: shouldSuggestVideos,
          videos: videos,
        };
      }
      
      // Track successful API call
      this.apiStats.successfulRequests++;
      
      return {
        text: text,
        tokensIn: estimatedTokensIn,
        tokensOut: estimatedTokensOut,
        shouldSuggestVideos: shouldSuggestVideos,
        videos: videos,
      };
    } catch (error) {
      // Track failed API call
      this.apiStats.failedRequests++;
      this.apiStats.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.apiStats.lastErrorTime = new Date();
      
      // Enhanced error logging to identify specific failure reasons
      console.error('Error generating OpenAI response:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          console.error('OPENAI API QUOTA/LIMIT ERROR:', error.message);
        } else if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
          console.error('OPENAI API KEY ERROR:', error.message);
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          console.error('OPENAI NETWORK/TIMEOUT ERROR:', error.message);
        } else if (errorMessage.includes('safety') || errorMessage.includes('filter')) {
          console.error('OPENAI SAFETY FILTER ERROR:', error.message);
        } else if (errorMessage.includes('model') || errorMessage.includes('unavailable')) {
          console.error('OPENAI MODEL UNAVAILABLE ERROR:', error.message);
        } else {
          console.error('OPENAI UNKNOWN ERROR:', error.message);
        }
      }
      
      return await this.getFallbackResponse(userMessage, language, conversationHistory);
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
      anxiety: ['anxiety', 'worry', 'stress', 'nervous', 'panic', 'fear', 'overwhelmed', 'tense', 'worried', 'stressed', 'tension', 'career tension'],
      depression: ['depression', 'sad', 'hopeless', 'empty', 'worthless', 'down', 'blue', 'miserable', 'sadness', 'wrong decision', 'mistake', 'chuktay'],
      relationships: ['relationship', 'partner', 'family', 'friend', 'love', 'marriage', 'dating', 'breakup', 'social'],
      work: ['work', 'job', 'career', 'professional', 'office', 'boss', 'colleague', 'workplace', 'pressure', 'decision', 'career decision'],
      sleep: ['sleep', 'insomnia', 'rest', 'tired', 'exhausted', 'bed', 'night', 'dream', 'fatigue'],
      mindfulness: ['mindfulness', 'meditation', 'breathing', 'calm', 'peace', 'zen', 'yoga', 'relaxation', 'meditate'],
      self_care: ['self care', 'self-care', 'wellness', 'health', 'care', 'healing', 'recovery', 'mental health'],
      emotions: ['emotion', 'feeling', 'mood', 'happy', 'sad', 'angry', 'frustrated', 'joy', 'feelings', 'mala kahich nai karaycha'],
      grief: ['grief', 'loss', 'death', 'mourning', 'bereavement', 'missing', 'gone', 'losing'],
      confidence: ['confidence', 'self-esteem', 'worth', 'value', 'believe', 'capable', 'strong', 'self worth'],
      video: ['video', 'videos', 'youtube', 'watch', 'show me']
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

  private static isThankYouMessage(message: string): boolean {
    const thankYouKeywords = [
      'thank', 'thanks', 'thank you', 'grateful', 'appreciate', 'appreciated',
      'धन्यवाद', 'शुक्रिया', 'आभार', 'कृतज्ञ', 'आभारी',
      'धन्यवाद', 'आभार', 'कृतज्ञ', 'आभारी'
    ];
    
    const lowerMessage = message.toLowerCase().trim();
    return thankYouKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private static shouldSuggestVideos(analysis: any, totalMessages: number): boolean {
    // Always suggest videos for crisis responses
    if (analysis.type === 'crisis') {
      return true;
    }
    
    // For testing: always suggest videos if user asks for videos
    if (analysis.topics.includes('video') || analysis.topics.includes('youtube')) {
      return true;
    }
    
    // Suggest videos for wellness topics after 2+ messages
    if (analysis.type === 'wellness') {
      const wellnessTopics = analysis.topics.includes('anxiety') || 
                            analysis.topics.includes('stress') ||
                            analysis.topics.includes('mindfulness') ||
                            analysis.topics.includes('self_care') ||
                            analysis.topics.includes('depression') ||
                            analysis.topics.includes('sleep') ||
                            analysis.topics.includes('relationships') ||
                            analysis.topics.includes('work') ||
                            analysis.topics.includes('emotions') ||
                            analysis.topics.includes('grief') ||
                            analysis.topics.includes('confidence');
      
      // Suggest videos after 2+ messages for wellness topics
      if (wellnessTopics && totalMessages >= 2) {
        return true;
      }
    }
    
    // For general questions about mental health, suggest videos after 2+ messages
    if (analysis.type === 'general_question') {
      const mentalHealthKeywords = ['mental health', 'therapy', 'counseling', 'psychology', 'wellness', 'self care'];
      const hasMentalHealthContent = mentalHealthKeywords.some(keyword => 
        analysis.topics.some((topic: string) => topic.toLowerCase().includes(keyword))
      );
      
      if (hasMentalHealthContent && totalMessages >= 2) {
        return true;
      }
    }
    
    return false;
  }

  private static async getRelevantVideosForContext(analysis: any, userMessage: string, language: 'en' | 'hi' | 'mr'): Promise<any[]> {
    try {
      // Determine the best video type based on analysis
      if (analysis.topics.includes('anxiety') || analysis.topics.includes('stress')) {
        return await youtubeService.getExerciseVideos('anxiety_relief', language);
      } else if (analysis.topics.includes('depression')) {
        return await youtubeService.getVideosForEmotionalState('depression', language);
      } else if (analysis.topics.includes('sleep')) {
        return await youtubeService.getExerciseVideos('sleep', language);
      } else if (analysis.topics.includes('mindfulness')) {
        return await youtubeService.getExerciseVideos('mindfulness', language);
      } else if (analysis.topics.includes('relationships')) {
        return await youtubeService.getVideosForEmotionalState('relationships', language);
      } else if (analysis.topics.includes('work')) {
        return await youtubeService.getVideosForEmotionalState('work_stress', language);
      } else if (analysis.topics.includes('confidence')) {
        return await youtubeService.getVideosForEmotionalState('confidence', language);
      } else {
        // General wellness videos
        return await youtubeService.getRelevantVideos(userMessage, language);
      }
    } catch (error) {
      console.error('Error getting relevant videos:', error);
      return [];
    }
  }

  private static createVoiceConversationPrompt(
    analysis: any, 
    language: 'en' | 'hi' | 'mr', 
    userName: string, 
    userMessage: string, 
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    const isFirstMessage = conversationHistory.length === 0;
    const hasSharedPersonal = conversationHistory.some(msg => 
      msg.role === 'user' && (
        msg.content.length > 50 || 
        ['feel', 'stress', 'anxious', 'sad', 'happy', 'worried', 'tired'].some(word => 
          msg.content.toLowerCase().includes(word)
        )
      )
    );
    
    // Extract specific topics and concerns from the user's message
    const specificTopics = analysis.topics.join(', ');
    const emotionalContext = analysis.emotionalTone;
    const needsSupport = analysis.needsSupport;
    
    switch (analysis.type) {
      case 'crisis':
        return `CRISIS CONVERSATION: ${userName} may be in crisis. Respond with immediate care and concern. Show that you're truly listening and worried about them. Gently but clearly suggest they get professional help. Be warm but serious. Speak in ${languageText} as if you're a caring friend who is genuinely concerned.`;
      
      case 'general_question':
        return `GENERAL QUESTION: ${userName} asked: "${userMessage}". Answer their specific question in a friendly, conversational way. Provide helpful information related to their question. Keep it natural and engaging. NO MEDICAL DISCLAIMER needed for general questions. Respond in ${languageText}.`;
      
      case 'casual':
        if (isFirstMessage) {
          return `FIRST GREETING: This is your first conversation with ${userName}. They said: "${userMessage}". Respond warmly and naturally as if meeting a new friend. Ask a gentle, caring question about how they're doing. Be genuinely interested in them. NO MEDICAL DISCLAIMER needed for greetings. Respond in ${languageText}.`;
        } else {
          return `CASUAL CONVERSATION: ${userName} said: "${userMessage}". Continue the natural conversation. Respond as if you're chatting with a friend. Be warm and engaging. NO MEDICAL DISCLAIMER needed for casual chat. Respond in ${languageText}.`;
        }
      
      case 'wellness':
        const supportLevel = analysis.emotionalTone === 'negative' ? 'strong emotional support and' : '';
        const personalContext = hasSharedPersonal ? 'They have shared personal things with you before, so respond with familiarity and care.' : '';
        const topicContext = specificTopics ? `They're specifically talking about: ${specificTopics}.` : '';
        
        return `WELLNESS CONVERSATION: ${userName} is talking about their mental health or wellbeing. They said: "${userMessage}". ${topicContext} Provide ${supportLevel} gentle, practical suggestions based on what they specifically shared. ${personalContext} Acknowledge what they shared, validate their feelings, and offer one simple thing they can try related to their specific concern. Ask a caring follow-up question. Be like a supportive friend, not a therapist. ADD MEDICAL DISCLAIMER when giving specific coping strategies or mental health advice. Respond in ${languageText}.`;
      
      default:
        return `NATURAL CONVERSATION: ${userName} said: "${userMessage}". Respond to their specific message naturally and warmly. Be genuinely interested in what they're sharing. If they seem to need support, be caring. If they're just chatting, be friendly. NO MEDICAL DISCLAIMER needed for general conversation. Respond in ${languageText} as if you're a caring friend.`;
    }
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
         return `${topicContext}${toneContext}This is a wellness-related conversation. Provide SPECIFIC, ACTIONABLE advice and coping strategies. Give concrete techniques they can try immediately. If they ask about stress management, provide breathing exercises, meditation techniques, or lifestyle changes. Be specific and helpful. IMPORTANT: Keep your response SHORT - maximum 10 lines with 2-3 key points only. Use simple formatting (• or -) for lists, NEVER use asterisks (*). Respond in ${languageText}.`;
      
      default:
        return `Respond naturally to the user's message. Keep it conversational and friendly while maintaining context. Respond in ${languageText}.`;
    }
  }

  private static async getFallbackResponse(
    userMessage: string, 
    language: 'en' | 'hi' | 'mr',
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AIResponse> {
    const analysis = this.analyzeMessage(userMessage, conversationHistory);
    const totalMessages = conversationHistory.length + 1;
    const shouldSuggestVideos = this.shouldSuggestVideos(analysis, totalMessages);
    
    // Check if this is a follow-up message in an ongoing conversation
    const isFollowUp = conversationHistory.length > 0;
    
    // Generate contextual response based on specific user message
    const contextualResponse = this.generateContextualFallback(userMessage, analysis, language, isFollowUp);
    if (contextualResponse) {
      // Get relevant videos if needed
      let videos: any[] = [];
      if (shouldSuggestVideos) {
        try {
          videos = await this.getRelevantVideosForContext(analysis, userMessage, language);
        } catch (error) {
          console.error('Error fetching videos in fallback:', error);
        }
      }
      
      return {
        text: contextualResponse,
        tokensIn: userMessage.length / 4,
        tokensOut: contextualResponse.length / 4,
        shouldSuggestVideos: shouldSuggestVideos,
        videos: videos,
      };
    }
    
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
          "नमस्ते 👋 मैं आपकी मदद के लिए यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?",
          "हाय! मुझे खुशी है कि आप यहाँ हैं। क्या आप अपने मन की बात साझा करना चाहेंगे?",
          "हेलो, वापस आने के लिए धन्यवाद। क्या आप तनाव, भावनाओं या अपने दिन के बारे में बात करना चाहते हैं?",
          "नमस्ते! आपके मन में क्या है?",
          "हाय! मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहाँ हूँ।",
          "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?",
        ],
        casual_followup: [
          "फिर से नमस्ते! कैसे हैं आप?",
          "हाय! आपसे फिर बात करके अच्छा लगा।",
          "हेलो! पिछली बार से आपका दिन कैसा जा रहा है?",
          "नमस्ते! क्या नया है आपके साथ?",
          "हाय! आज आप कैसा महसूस कर रहे हैं?",
        ],
        thank_you: [
          "आपका स्वागत है 🌸 याद रखें, रोज़ छोटे-छोटे कदम उठाने से वाकई मदद मिलती है।",
          "मुझे खुशी है कि मैं मदद कर सका। अपना ख्याल रखें।",
          "कभी भी! जब भी आपको सहायता की आवश्यकता हो, आप हमेशा वापस आ सकते हैं।",
        ],
        wellness: [
          "तनाव प्रबंधन के लिए, यह 4-7-8 श्वास तकनीक आज़माएं: 4 गिनती तक सांस अंदर लें, 7 तक रोकें, 8 तक छोड़ें। 5 बार दोहराएं। यह आपके पैरासिम्पेथेटिक नर्वस सिस्टम को सक्रिय करता है और तुरंत आराम देता है।",
          "जब अभिभूत महसूस करें, 5-4-3-2-1 ग्राउंडिंग तकनीक आज़माएं: 5 चीज़ें जो आप देखते हैं, 4 जो छू सकते हैं, 3 जो सुनते हैं, 2 जो सूंघते हैं, 1 जो चखते हैं। यह आपको वर्तमान क्षण में वापस लाता है।",
          "तनाव से राहत के लिए, प्रोग्रेसिव मसल रिलैक्सेशन आज़माएं: हर मांसपेशी समूह को 5 सेकंड तक तनाव दें, फिर छोड़ें। पैर की उंगलियों से शुरू करके सिर तक जाएं। यह शारीरिक तनाव मुक्त करता है।",
          "10 मिनट का ब्रेक लें और माइंडफुलनेस का अभ्यास करें: आराम से बैठें, अपनी सांस पर ध्यान केंद्रित करें, और जब विचार आएं, तो धीरे से सांस लेने पर वापस आएं। यह दिमाग साफ करने में मदद करता है।",
          "आंखों के तनाव के लिए 20-20-20 नियम आज़माएं: हर 20 मिनट में, 20 फीट दूर किसी चीज़ को 20 सेकंड तक देखें। यह डिजिटल आंखों के तनाव और मानसिक थकान को कम करता है।"
        ],
        wellness_followup: [
          "श्वास तकनीक आपके लिए कैसे काम कर रही है? अगर आपको और तनाव से राहत चाहिए, तो यह त्वरित व्यायाम आज़माएं: खड़े हो जाएं, अपनी बाहें ऊपर फैलाएं, 3 गहरी सांसें लें, फिर अपने हाथों और बाहों को हिलाएं।",
          "पिछली बार बात करने के बाद से, क्या आपने कोई विश्राम तकनीक आज़माई है? यहाँ एक और त्वरित तकनीक है: अपनी आंखें बंद करें, एक शांत जगह की कल्पना करें, और 5 धीमी, गहरी सांसें लें।",
          "मैं आपका समर्थन करने के लिए यहाँ हूँ। यह 2-मिनट का तनाव बस्टर आज़माएं: सीधे बैठें, एक हाथ अपनी छाती पर रखें, एक पेट पर, और सांस लें ताकि केवल आपका पेट वाला हाथ हिले।",
          "अब आप कैसा महसूस कर रहे हैं? अगर अभी भी तनाव है, तो यह आज़माएं: अपने कंधों को 5 सेकंड तक तनाव दें, फिर पूरी तरह से छोड़ दें। 3 बार दोहराएं।",
          "कुछ अलग आज़माते हैं: 5-मिनट की सैर करें, यहाँ तक कि अपने कमरे के चारों ओर भी, जबकि अपनी सांस पर ध्यान केंद्रित करें। गति तनाव हार्मोन को मुक्त करने में मदद करती है।"
        ],
        general: [
          "मैं आपकी बात सुनने और आपका समर्थन करने के लिए यहाँ हूं। आप क्या बात करना चाहते हैं?",
          "संपर्क करने के लिए धन्यवाद. आज मैं आपकी कैसे मदद कर सकता हूं?",
          "मैं आपके लिए यहाँ हूं। आपके मन में क्या है?",
          "मैं सुन रहा हूं। मुझे बताएं कि आप क्या अनुभव कर रहे हैं।",
          "मैं आपका समर्थन करने के लिए यहाँ हूं। आप क्या चर्चा करना चाहते हैं?",
        ],
        general_followup: [
          "मैं हमारी बातचीत जारी रखने के लिए यहाँ हूं। आप क्या बात करना चाहते हैं?",
          "पुनः संपर्क करने के लिए धन्यवाद। आज मैं आपकी कैसे मदद कर सकता हूं?",
          "मैं आपके लिए यहाँ हूं। पिछली बार से आपके मन में क्या है?",
          "मैं सुन रहा हूं। मुझे बताएं कि आप क्या अनुभव कर रहे हैं।",
          "मैं आपका समर्थन करने के लिए यहाँ हूं। आप क्या चर्चा करना चाहते हैं?",
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
          "मी तुमची मदत करण्यात आनंदी असेन! मी तुम्हाला काही उपयुक्त माहिती प्रदान करता है."
        ],
        casual: [
          "नमस्कार 👋 मी तुमची मदत करण्यासाठी येथे आहे. आज तुम्हाला कसे वाटत आहे?",
          "हाय! मला आनंद आहे की तुम्ही येथे आहात. तुम्हाला तुमच्या मनातील गोष्ट सामायिक करायची आहे का?",
          "हेलो, परत येण्याबद्दल धन्यवाद. तुम्हाला तणाव, भावना किंवा फक्त तुमचा दिवस कसा गेला याबद्दल बोलायचे आहे का?",
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
        thank_you: [
          "तुमचे स्वागत आहे 🌸 लक्षात ठेवा, दररोज लहान लहान पावले उचलल्याने खरोखर मदत होते.",
          "मला आनंद आहे की मी मदत करू शकलो. स्वतःची काळजी घ्या.",
          "कधीही! जेव्हा तुम्हाला मदतीची गरज असेल तेव्हा तुम्ही नेहमी परत येऊ शकता.",
        ],
        wellness: [
          "तणाव व्यवस्थापनासाठी, ही 4-7-8 श्वास तंत्र वापरा: 4 मोजणीपर्यंत श्वास घ्या, 7 पर्यंत धरा, 8 पर्यंत सोडा. 5 वेळा पुन्हा करा. हे तुमच्या पॅरासिम्पॅथेटिक नर्व्हस सिस्टमला सक्रिय करते आणि त्वरित आराम देते.",
          "जेव्हा अधिक भार वाटत असेल, 5-4-3-2-1 ग्राउंडिंग तंत्र वापरा: 5 गोष्टी ज्या तुम्ही पाहता, 4 ज्या स्पर्श करू शकता, 3 ज्या ऐकता, 2 ज्या वास घेता, 1 जी चव घेता. हे तुम्हाला वर्तमान क्षणात परत आणते.",
          "तणाव सुटण्यासाठी, प्रोग्रेसिव्ह मसल रिलॅक्सेशन वापरा: प्रत्येक स्नायू गटाला 5 सेकंद ताण द्या, नंतर सोडा. पायाच्या बोटांपासून डोक्यापर्यंत जा. हे शारीरिक तणाव मुक्त करते.",
          "10 मिनिटांचा ब्रेक घ्या आणि माइंडफुलनेस सराव करा: आरामात बसा, तुमच्या श्वासावर लक्ष केंद्रित करा, आणि जेव्हा विचार येतात, तेव्हा हळूवारपणे श्वास घेण्याकडे परत जा. हे मन साफ करण्यास मदत करते.",
          "डोळ्यांच्या तणावासाठी 20-20-20 नियम वापरा: दर 20 मिनिटांनी, 20 फूट दूर असलेल्या एखाद्या गोष्टीकडे 20 सेकंद पहा. हे डिजिटल डोळ्यांचा तणाव आणि मानसिक थकवा कमी करते."
        ],
        wellness_followup: [
          "श्वास तंत्र तुमच्यासाठी कसे काम करत आहे? जर तुम्हाला अधिक तणाव सुटण्याची गरज असेल, तर हा त्वरित व्यायाम वापरा: उभे रहा, तुमच्या हातांना वर फैलावा, 3 खोल श्वास घ्या, नंतर तुमच्या हातांना आणि हातांना हलवा.",
          "मागच्या वेळेपासून, तुम्ही कोणतेही विश्रांती तंत्र वापरल्यात का? येथे आणखी एक त्वरित तंत्र आहे: तुमचे डोळे बंद करा, शांत जागेची कल्पना करा, आणि 5 हळू, खोल श्वास घ्या.",
          "मी तुमचे समर्थन करण्यासाठी येथे आहे. हा 2-मिनिटांचा तणाव बस्टर वापरा: सरळ बसा, एक हात तुमच्या छातीवर ठेवा, एक पोटावर, आणि श्वास घ्या जेणेकरून फक्त तुमचा पोटाचा हात हलतो.",
          "आता तुम्हाला कसे वाटत आहे? जर अजूनही तणाव असेल, तर हे वापरा: तुमच्या खांद्यांना 5 सेकंद ताण द्या, नंतर पूर्णपणे सोडा. 3 वेळा पुन्हा करा.",
          "काहीतरी वेगळे वापरू: 5-मिनिटांची चाल करा, जरी तुमच्या खोलीभोवतीही, तुमच्या श्वासावर लक्ष केंद्रित करत. हालचाल तणाव हार्मोन मुक्त करण्यास मदत करते."
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

    // Get relevant videos if needed
    let videos: any[] = [];
    if (shouldSuggestVideos) {
      try {
        videos = await this.getRelevantVideosForContext(analysis, userMessage, language);
      } catch (error) {
        console.error('Error fetching videos in final fallback:', error);
      }
    }

    return {
      text: selectedResponse,
      tokensIn: userMessage.length / 4,
      tokensOut: selectedResponse.length / 4,
      shouldSuggestVideos: shouldSuggestVideos,
      videos: videos,
    };
  }

  private static generateContextualFallback(
    userMessage: string, 
    analysis: any, 
    language: 'en' | 'hi' | 'mr', 
    isFollowUp: boolean
  ): string | null {
    const lowerMessage = userMessage.toLowerCase();
    
    // Get relevant knowledge for enhanced fallback responses
    const relevantKnowledge = this.getRelevantKnowledge(userMessage);
    
    // Handle specific stress/anxiety mentions
    if (lowerMessage.includes('stress') || lowerMessage.includes('tension') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      if (language === 'hi') {
        return "मैं समझता हूं कि आप तनाव महसूस कर रहे हैं। यह बहुत सामान्य है। गहरी सांस लेने की तकनीक आज़माएं: 4 सेकंड सांस अंदर लें, 4 सेकंड रोकें, 4 सेकंड छोड़ें। यह तनाव कम करने में मदद करता है। आप कैसा महसूस कर रहे हैं? यह चिकित्सा सलाह नहीं है। निदान या उपचार के लिए, कृपया एक योग्य मानसिक स्वास्थ्य पेशेवर से परामर्श करें।";
      } else if (language === 'mr') {
        return "मी समजतो की तुम्हाला तणाव वाटत आहे. हे खूप सामान्य आहे. खोल श्वास तंत्र वापरा: 4 सेकंद श्वास घ्या, 4 सेकंद धरा, 4 सेकंद सोडा. हे तणाव कमी करण्यात मदत करते. तुम्हाला कसे वाटत आहे? ही वैद्यकीय सल्ला नाही. निदान किंवा उपचारासाठी, कृपया योग्य मानसिक आरोग्य व्यावसायिकांशी सल्ला घ्या.";
      } else {
        return "I understand you're feeling stressed. That's very common. Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. This helps reduce stress. How are you feeling right now? This is not medical advice. For diagnosis or treatment, please consult a qualified mental health professional.";
      }
    }
    
    // Handle career/work concerns
    if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('work') || lowerMessage.includes('decision') || lowerMessage.includes('tension')) {
      if (language === 'hi') {
        return "कैरियर के बारे में चिंता करना बहुत सामान्य है। यह एक बड़ा निर्णय है। अपने मूल्यों और रुचियों के बारे में सोचें। क्या आप अपने करियर के बारे में कुछ विशिष्ट चिंताएं साझा करना चाहेंगे?";
      } else if (language === 'mr') {
        return "करिअरबद्दल चिंता करणे खूप सामान्य आहे. हा एक मोठा निर्णय आहे. तुमच्या मूल्ये आणि आवडींबद्दल विचार करा. तुम्हाला तुमच्या करिअरबद्दल काही विशिष्ट चिंता सामायिक करायची आहे का?";
      } else {
        return "Career concerns are very common. It's a big decision. Think about your values and interests. Would you like to share any specific concerns about your career path?";
      }
    }
    
    // Handle wrong decision/regret feelings
    if (lowerMessage.includes('wrong') || lowerMessage.includes('mistake') || lowerMessage.includes('chuktay') || lowerMessage.includes('regret')) {
      if (language === 'hi') {
        return "गलत निर्णय लगने से निराश होना स्वाभाविक है। हर कोई गलतियां करता है। यह आपको सिखाता है और आगे बेहतर निर्णय लेने में मदद करता है। क्या आप इस निर्णय के बारे में बात करना चाहेंगे?";
      } else if (language === 'mr') {
        return "चुकीचा निर्णय वाटणे हे नैसर्गिक आहे. प्रत्येकजण चुका करतो. हे तुम्हाला शिकवते आणि पुढे चांगले निर्णय घेण्यात मदत करते. तुम्हाला या निर्णयाबद्दल बोलायचे आहे का?";
      } else {
        return "Feeling like you made a wrong decision is natural. Everyone makes mistakes. This teaches you and helps you make better decisions in the future. Would you like to talk about this decision?";
      }
    }
    
    // Handle apathy/lack of motivation
    if (lowerMessage.includes('kahich nai karaycha') || lowerMessage.includes('dont want to do') || lowerMessage.includes('nothing') || lowerMessage.includes('motivation')) {
      if (language === 'hi') {
        return "कभी-कभी कुछ भी नहीं करना चाहते, यह बिल्कुल सामान्य है। यह आपके मन और शरीर का आराम मांगने का तरीका है। छोटे-छोटे कदम उठाएं। आप कैसा महसूस कर रहे हैं?";
      } else if (language === 'mr') {
        return "कधीकधी काहीही करायचे नसते, हे पूर्णपणे सामान्य आहे. हे तुमच्या मन आणि शरीराचा विश्रांती मागण्याचा मार्ग आहे. लहान पावले उचला. तुम्हाला कसे वाटत आहे?";
      } else {
        return "Sometimes not wanting to do anything is completely normal. It's your mind and body's way of asking for rest. Take small steps. How are you feeling right now?";
      }
    }
    
    // Handle depression/sadness
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || lowerMessage.includes('hopeless')) {
      if (language === 'hi') {
        return "मैं समझता हूं कि आप उदास महसूस कर रहे हैं। यह भावना अस्थायी है। अपने आप पर दया करें और छोटे-छोटे कदम उठाएं। क्या आप कुछ ऐसा कर सकते हैं जो आपको थोड़ा बेहतर महसूस कराए?";
      } else if (language === 'mr') {
        return "मी समजतो की तुम्हाला उदास वाटत आहे. ही भावना तात्पुरती आहे. स्वतःवर दया करा आणि लहान पावले उचला. तुम्ही काहीतरी करू शकता का जे तुम्हाला थोडे चांगले वाटेल?";
      } else {
        return "I understand you're feeling sad. This feeling is temporary. Be kind to yourself and take small steps. Is there something you can do that might make you feel a little better?";
      }
    }
    
    // Handle speech/presentation anxiety
    if (lowerMessage.includes('speech') || lowerMessage.includes('presentation') || lowerMessage.includes('stage') || lowerMessage.includes('nervous') || lowerMessage.includes('नर्वसनेस') || lowerMessage.includes('स्पीच') || lowerMessage.includes('स्टेज')) {
      if (language === 'hi') {
        return "स्पीच या प्रेजेंटेशन से पहले नर्वस होना बहुत सामान्य है। गहरी सांस लें और याद रखें कि आप तैयार हैं। अपने मुख्य बिंदुओं पर फोकस करें। आप कैसा महसूस कर रहे हैं?";
      } else if (language === 'mr') {
        return "स्पीच किंवा प्रेझेंटेशनपूर्वी नर्वस होणे खूप सामान्य आहे. खोल श्वास घ्या आणि लक्षात ठेवा की तुम्ही तयार आहात. तुमच्या मुख्य मुद्द्यांवर लक्ष केंद्रित करा. तुम्हाला कसे वाटत आहे?";
      } else {
        return "Feeling nervous before a speech or presentation is very common. Take deep breaths and remember you're prepared. Focus on your main points. How are you feeling?";
      }
    }
    
    // Handle sleep issues
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      if (language === 'hi') {
        return "नींद की समस्या बहुत आम है। सोने से पहले स्क्रीन टाइम कम करें और एक शांत दिनचर्या बनाएं। क्या आपको सोने में कठिनाई हो रही है या आप बहुत थक गए हैं?";
      } else if (language === 'mr') {
        return "झोपेची समस्या खूप सामान्य आहे. झोपण्यापूर्वी स्क्रीन वेळ कमी करा आणि शांत दिनचर्या तयार करा. तुम्हाला झोपण्यात अडचण येत आहे का किंवा तुम्ही खूप थकलात?";
      } else {
        return "Sleep issues are very common. Reduce screen time before bed and create a calming routine. Are you having trouble falling asleep or feeling very tired?";
      }
    }
    
    // Handle relationship concerns
    if (lowerMessage.includes('relationship') || lowerMessage.includes('family') || lowerMessage.includes('friend') || lowerMessage.includes('partner')) {
      if (language === 'hi') {
        return "रिश्तों में चुनौतियां आना सामान्य है। संवाद महत्वपूर्ण है। क्या आप किसी विशिष्ट रिश्ते के बारे में बात करना चाहेंगे?";
      } else if (language === 'mr') {
        return "नातेसंबंधात आव्हाने येणे सामान्य आहे. संवाद महत्वाचा आहे. तुम्हाला कोणत्याही विशिष्ट नात्याबद्दल बोलायचे आहे का?";
      } else {
        return "Relationship challenges are normal. Communication is key. Would you like to talk about a specific relationship that's concerning you?";
      }
    }
    
    return null; // No specific contextual response found
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
    language: 'en' | 'hi' | 'mr',
    force: boolean = false
  ): Promise<string> {
    try {
      if (!hasOpenAIKey || !openai) {
        return this.generateFallbackSummary(messages, language, force);
      }

      const userMessages = messages.filter(msg => msg.role === 'user');
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');

      // Detect actual session language from messages
      const actualLanguage = this.detectSessionLanguage(messages);
      const languageText = actualLanguage === 'hi' ? 'Hindi' : actualLanguage === 'mr' ? 'Marathi' : 'English';

      console.log(`Session language detected: ${actualLanguage}, generating summary in ${languageText}`);

      // Fixed: More lenient criteria for summary generation
      // Require at least 1 meaningful user message and at least 1 assistant response
      const meaningfulUserMessages = userMessages.filter(msg => 
        msg.content.trim().length > 5 && 
        !this.isJustGreeting(msg.content) &&
        !this.isCasualGreeting(msg.content)
      );

      // More lenient: Allow summaries for sessions with at least 1 meaningful interaction
      if (meaningfulUserMessages.length < 1 || assistantMessages.length < 1) {
        if (force) {
          console.log(`Force mode: Generating summary despite minimal interaction (${meaningfulUserMessages.length} meaningful user messages, ${assistantMessages.length} assistant responses)`);
        } else {
          console.log(`Session has insufficient interaction (${meaningfulUserMessages.length} meaningful user messages, ${assistantMessages.length} assistant responses), skipping summary generation`);
          return ''; // Return empty string to indicate no summary should be generated
        }
      }

      // Fixed: Even more lenient - allow summaries for any meaningful interaction
      const hasRealProblems = meaningfulUserMessages.some(msg => 
        this.indicatesProblemDiscussion(msg.content)
      );

      // Only skip if there's very minimal interaction (less than 2 meaningful messages) and not forcing
      if (!hasRealProblems && meaningfulUserMessages.length < 2 && !force) {
        console.log(`Session contains very limited meaningful interaction (${meaningfulUserMessages.length} messages), skipping summary generation`);
        return '';
      }

      // Create a comprehensive summary that focuses on user's situation and outcomes
      const summaryPrompt = `You are a mental wellness assistant. Generate a comprehensive, user-focused summary of this mental wellness session.

CRITICAL LANGUAGE REQUIREMENT: You MUST write the ENTIRE summary in ${languageText} language ONLY. Do not use any other language. Every single word must be in ${languageText}.

CONVERSATION CONTEXT:
User messages: ${userMessages.map(m => m.content).join(' | ')}
Assistant responses: ${assistantMessages.length} supportive responses provided

SUMMARY REQUIREMENTS (Write in ${languageText} ONLY):
Create a summary that answers these key questions:
1. What is the user currently facing or struggling with?
2. What is the overall conclusion or main takeaway from the session?
3. What specific challenges or issues were identified?
4. What support or guidance was provided?
5. What is the user's current emotional/mental state based on the conversation?

FORMAT: Write as a clear, concise paragraph in ${languageText} that gives the user a complete picture of:
- Their current situation/challenges
- What was discussed and resolved
- Key insights or realizations
- Next steps or recommendations
- Overall emotional state and progress

Make it personal and specific to what the user shared, not generic. Focus on the user's journey and what they're going through.

ABSOLUTE REQUIREMENT: The entire response must be written in ${languageText} language. Do not use English or any other language.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: `You are a mental wellness assistant that creates comprehensive, user-focused session summaries. You MUST write summaries in the exact language specified in the user's request. If the user asks for a summary in Hindi, write ONLY in Hindi. If the user asks for a summary in Marathi, write ONLY in Marathi. If the user asks for a summary in English, write ONLY in English. Never mix languages.` },
          { role: 'user', content: summaryPrompt }
        ],
        max_tokens: 300,
        temperature: 0.3
      });
      
      const text = completion.choices[0]?.message?.content || '';

      console.log(`Generated comprehensive summary: ${text}`);

      // Ensure the response is in the correct language
      if (text && this.isLanguageCorrect(text, actualLanguage)) {
        return text;
      } else {
        // If AI didn't follow language instruction, use fallback
        console.log(`Language validation failed, using fallback summary in ${actualLanguage}`);
        return this.generateFallbackSummary(messages, actualLanguage, force);
      }
    } catch (error) {
      console.error('Error generating session summary:', error);
      return this.generateFallbackSummary(messages, language, force);
    }
  }

  // Helper method to check if message is just a greeting
  private static isJustGreeting(message: string): boolean {
    const greetings = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'namaste', 'namaskar', 'pranam', 'adab',
      'हाय', 'हैलो', 'नमस्ते', 'नमस्कार', 'प्रणाम',
      'हाय', 'हॅलो', 'नमस्कार', 'नमस्ते', 'आदाब'
    ];
    
    const lowerMessage = message.toLowerCase().trim();
    return greetings.some(greeting => 
      lowerMessage === greeting || 
      lowerMessage.startsWith(greeting + ' ') ||
      lowerMessage.endsWith(' ' + greeting)
    ) && lowerMessage.length < 50;
  }

  // Helper method to check if message indicates problem discussion
  private static indicatesProblemDiscussion(message: string): boolean {
    const problemIndicators = [
      // English
      'problem', 'issue', 'stress', 'anxiety', 'worried', 'sad', 'depressed', 'help',
      'difficult', 'struggle', 'challenge', 'pain', 'hurt', 'feel', 'feeling',
      'trouble', 'concern', 'fear', 'upset', 'angry', 'frustrated', 'tired',
      
      // Hindi
      'समस्या', 'परेशानी', 'चिंता', 'दुख', 'दर्द', 'मदद', 'परेशान', 'उदास',
      'डर', 'भय', 'गुस्सा', 'थकान', 'मुश्किल', 'कठिनाई', 'तनाव',
      
      // Marathi
      'समस्या', 'अडचण', 'चिंता', 'दुःख', 'वेदना', 'मदत', 'त्रास', 'उदास',
      'भीती', 'राग', 'थकवा', 'कठीण', 'अवघड', 'ताणतणाव'
    ];
    
    const lowerMessage = message.toLowerCase();
    return problemIndicators.some(indicator => 
      lowerMessage.includes(indicator.toLowerCase())
    ) || message.length > 30; // Longer messages likely contain real content
  }

  private static isLanguageCorrect(text: string, expectedLanguage: 'en' | 'hi' | 'mr'): boolean {
    if (expectedLanguage === 'en') {
      // Check if text contains English characters and doesn't contain Devanagari
      const hasEnglish = /[a-zA-Z]/.test(text);
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      return hasEnglish && !hasDevanagari;
    } else if (expectedLanguage === 'hi') {
      // Check if text contains Devanagari characters and has Hindi-specific words
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      const hindiWords = ['क्या', 'कैसे', 'मैं', 'है', 'हैं', 'मुझे', 'तुम्हें', 'हमारा', 'तुम्हारा'];
      const hasHindiWords = hindiWords.some(word => text.includes(word));
      return hasDevanagari && (hasHindiWords || text.length > 10); // Allow if has Devanagari and either Hindi words or sufficient length
    } else if (expectedLanguage === 'mr') {
      // Check if text contains Devanagari characters and has Marathi-specific words
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      const marathiWords = ['काय', 'कसे', 'मी', 'आहे', 'आहात', 'मला', 'तुम्हाला', 'आमचा', 'तुमचा'];
      const hasMarathiWords = marathiWords.some(word => text.includes(word));
      return hasDevanagari && (hasMarathiWords || text.length > 10); // Allow if has Devanagari and either Marathi words or sufficient length
    }
    return true;
  }

  static detectSessionLanguage(messages: Array<{ role: 'user' | 'assistant'; content: string }>): 'en' | 'hi' | 'mr' {
    // Check user messages for language indicators
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    if (userMessages.length === 0) {
      console.log('No user messages found, defaulting to English');
      return 'en';
    }
    
    let hindiScore = 0;
    let marathiScore = 0;
    let englishScore = 0;
    
    // Combine all user messages for analysis
    const allUserContent = userMessages.map(msg => msg.content).join(' ');
    
    // Count characters
    const devanagariChars = (allUserContent.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (allUserContent.match(/[a-zA-Z]/g) || []).length;
    
    console.log(`Language detection - Devanagari chars: ${devanagariChars}, English chars: ${englishChars}`);
    
    // If significant Devanagari characters found, determine Hindi vs Marathi
    if (devanagariChars > 3) {
      // Marathi-specific words and patterns (expanded list)
      const marathiWords = [
        'काय', 'कसे', 'कधी', 'कुठे', 'कोण', 'कोणता', 'कोणती', 'कोणते',
        'मी', 'तू', 'तो', 'ती', 'ते', 'आम्ही', 'तुम्ही', 'ते', 'त्या',
        'आहात', 'आहे', 'आहेत', 'आहोत', 'आहेस', 'आहे', 'आहो',
        'करतो', 'करते', 'करतात', 'करतोस', 'करतो', 'करतो',
        'जातो', 'जाते', 'जातात', 'जातोस', 'जातो', 'जातो',
        'येतो', 'येते', 'येतात', 'येतोस', 'येतो', 'येतो',
        'होतो', 'होते', 'होतात', 'होतोस', 'होतो', 'होतो',
        'असतो', 'असते', 'असतात', 'असतोस', 'असतो', 'असतो',
        'मला', 'तुला', 'त्याला', 'तिला', 'त्यांना', 'आम्हाला', 'तुम्हाला',
        'माझा', 'तुझा', 'त्याचा', 'तिचा', 'त्यांचा', 'आमचा', 'तुमचा',
        'माझी', 'तुझी', 'त्याची', 'तिची', 'त्यांची', 'आमची', 'तुमची',
        'माझे', 'तुझे', 'त्याचे', 'तिचे', 'त्यांचे', 'आमचे', 'तुमचे',
        // Additional Marathi-specific words
        'घे', 'दे', 'ये', 'जा', 'हो', 'अस', 'कर', 'बस', 'उठ', 'चाल',
        'बोल', 'ऐक', 'पाह', 'दाखव', 'सांग', 'विचार', 'समज', 'शिक',
        'आनंद', 'दु:ख', 'चिंता', 'भीती', 'प्रेम', 'क्रोध', 'शांत', 'खुश',
        'थकले', 'आजारी', 'निरोगी', 'बरं', 'वाईट', 'चांगलं', 'सुंदर',
        'मोठं', 'लहान', 'जुने', 'नवीन', 'सुरुवात', 'शेवट', 'मध्ये',
        'वर', 'खाली', 'समोर', 'मागे', 'जवळ', 'दूर', 'आत', 'बाहेर'
      ];
      
      // Hindi-specific words and patterns
      const hindiWords = [
        'क्या', 'कैसे', 'कब', 'कहाँ', 'कौन', 'कौन सा', 'कौन सी', 'कौन से',
        'मैं', 'तू', 'वह', 'वो', 'हम', 'तुम', 'वे', 'वो',
        'हैं', 'है', 'हैं', 'हूं', 'है', 'है', 'हैं',
        'करता', 'करती', 'करते', 'करता', 'करता', 'करता',
        'जाता', 'जाती', 'जाते', 'जाता', 'जाता', 'जाता',
        'आता', 'आती', 'आते', 'आता', 'आता', 'आता',
        'होता', 'होती', 'होते', 'होता', 'होता', 'होता',
        'मुझे', 'तुझे', 'उसे', 'उसको', 'उन्हें', 'हमें', 'तुम्हें',
        'मेरा', 'तेरा', 'उसका', 'उसकी', 'उनका', 'हमारा', 'तुम्हारा',
        'मेरी', 'तेरी', 'उसकी', 'उसकी', 'उनकी', 'हमारी', 'तुम्हारी',
        'मेरे', 'तेरे', 'उसके', 'उसके', 'उनके', 'हमारे', 'तुम्हारे'
      ];
      
      // Count Marathi words
      const marathiCount = marathiWords.filter(word => allUserContent.includes(word)).length;
      const hindiCount = hindiWords.filter(word => allUserContent.includes(word)).length;
      
      console.log(`Language detection analysis:`, {
        userContent: allUserContent.substring(0, 200) + '...',
        devanagariChars,
        englishChars,
        marathiWordsFound: marathiCount,
        hindiWordsFound: hindiCount,
        marathiWords: marathiWords.filter(word => allUserContent.includes(word)),
        hindiWords: hindiWords.filter(word => allUserContent.includes(word))
      });
      
      // Score based on word matches
      marathiScore = marathiCount * 3; // Weight Marathi words more heavily
      hindiScore = hindiCount * 3; // Weight Hindi words more heavily
      
      // Additional scoring based on character patterns
      if (marathiCount > hindiCount) {
        marathiScore += devanagariChars;
        console.log('Language detected: Marathi (based on Marathi-specific words)');
        return 'mr';
      } else if (hindiCount > marathiCount) {
        hindiScore += devanagariChars;
        console.log('Language detected: Hindi (based on Hindi-specific words)');
        return 'hi';
      } else if (marathiCount > 0 && hindiCount === 0) {
        // If only Marathi words found, it's Marathi
        console.log('Language detected: Marathi (only Marathi words found)');
        return 'mr';
      } else if (hindiCount > 0 && marathiCount === 0) {
        // If only Hindi words found, it's Hindi
        console.log('Language detected: Hindi (only Hindi words found)');
        return 'hi';
      } else if (devanagariChars > 0) {
        // If no clear word matches but has Devanagari, default to Hindi
        console.log('Language detected: Hindi (default for Devanagari without clear Marathi indicators)');
        return 'hi';
      }
    }
    
    // If mostly English characters, return English
    if (englishChars > 5 && devanagariChars < 2) {
      console.log('Language detected: English (based on English characters)');
      return 'en';
    }
    
    // Default to English if unclear
    console.log('Language detection unclear, defaulting to English');
    return 'en';
  }

  private static generateFallbackSummary(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    language: 'en' | 'hi' | 'mr',
    force: boolean = false
  ): string {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    // Fixed: More lenient fallback criteria - require at least 1 user message and 1 assistant response
    if (userMessages.length < 1 || assistantMessages.length < 1) {
      if (force) {
        console.log(`Fallback: Force mode - generating summary despite minimal interaction (${userMessages.length} user messages, ${assistantMessages.length} assistant responses)`);
      } else {
        console.log(`Fallback: Session has insufficient interaction (${userMessages.length} user messages, ${assistantMessages.length} assistant responses), returning empty summary`);
        return ''; // Return empty string to indicate no summary should be generated
      }
    }
    
    // Analyze the conversation to create a more meaningful summary
    const firstUserMessage = userMessages[0]?.content || '';
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    const mainTopic = this.extractMainTopic(firstUserMessage);
    const emotionalState = this.detectEmotionalTone(lastUserMessage);
    const hasMultipleTopics = userMessages.length > 2;
    
    // Create a more comprehensive summary
    if (language === 'hi') {
      if (mainTopic) {
        const emotionalContext = emotionalState === 'negative' ? 'चुनौतियों का सामना कर रहे हैं' : 
                                emotionalState === 'positive' ? 'बेहतर महसूस कर रहे हैं' : 
                                'विभिन्न विषयों पर चर्चा की';
        return `जान्हवी ने ${mainTopic} के बारे में चर्चा की और ${emotionalContext}। सत्र में ${assistantMessages.length} सहायक सुझाव दिए गए और उनकी भावनात्मक स्थिति पर ध्यान दिया गया।`;
      }
      return `सत्र में ${userMessages.length} विषयों पर चर्चा हुई। जान्हवी ने अपनी चिंताओं और भावनाओं को साझा किया। ${assistantMessages.length} सहायक प्रतिक्रियाएं और मार्गदर्शन प्रदान किया गया।`;
    } else if (language === 'mr') {
      if (mainTopic) {
        const emotionalContext = emotionalState === 'negative' ? 'आव्हानांचा सामना करत आहेत' : 
                                emotionalState === 'positive' ? 'चांगले वाटत आहे' : 
                                'विविध विषयांवर चर्चा केली';
        return `जान्हवी ने ${mainTopic} बद्दल चर्चा केली आणि ${emotionalContext}. सत्रात ${assistantMessages.length} सहाय्यक सूचना दिल्या आणि त्यांच्या भावनिक स्थितीवर लक्ष केंद्रित केले.`;
      }
      return `सत्रात ${userMessages.length} विषयांवर चर्चा झाली. जान्हवी ने त्यांच्या चिंता आणि भावना सामायिक केल्या. ${assistantMessages.length} सहाय्यक प्रतिसाद आणि मार्गदर्शन प्रदान केले गेले.`;
    }
    
    // English fallback
    if (mainTopic) {
      const emotionalContext = emotionalState === 'negative' ? 'facing challenges' : 
                              emotionalState === 'positive' ? 'feeling better' : 
                              'discussed various topics';
      return `Janhavi discussed ${mainTopic} and is ${emotionalContext}. The session provided ${assistantMessages.length} supportive suggestions with focus on emotional well-being and practical guidance.`;
    }
    return `Session covered ${userMessages.length} topics where Janhavi shared concerns and feelings. ${assistantMessages.length} supportive responses and guidance were provided to help with emotional support and practical advice.`;
  }

  private static extractMainTopic(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Define comprehensive topic keywords with more specific categories
    const topics = {
      'stress and anxiety management': ['stress', 'anxiety', 'worried', 'overwhelmed', 'tension', 'nervous', 'panic', 'fear'],
      'sleep and rest issues': ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'bed', 'night', 'dream'],
      'work and career challenges': ['work', 'job', 'career', 'boss', 'colleague', 'deadline', 'office', 'professional', 'decision'],
      'relationship and family concerns': ['relationship', 'partner', 'family', 'friend', 'marriage', 'dating', 'breakup', 'social'],
      'self-care and wellness': ['self care', 'wellness', 'health', 'care', 'healing', 'recovery', 'mental health'],
      'mindfulness and meditation': ['mindfulness', 'meditation', 'breathing', 'calm', 'peace', 'zen', 'yoga', 'relaxation'],
      'confidence and self-esteem': ['confidence', 'self-esteem', 'worth', 'believe', 'capable', 'strong', 'self worth'],
      'depression and sadness': ['depression', 'sad', 'hopeless', 'empty', 'worthless', 'down', 'blue', 'miserable'],
      'grief and loss': ['grief', 'loss', 'death', 'mourning', 'bereavement', 'missing', 'gone', 'losing'],
      'emotional regulation': ['emotion', 'feeling', 'mood', 'angry', 'frustrated', 'upset', 'hurt', 'pain'],
      'life transitions': ['change', 'transition', 'new', 'moving', 'starting', 'ending', 'phase', 'stage'],
      'academic pressure': ['study', 'exam', 'school', 'college', 'university', 'academic', 'grades', 'education'],
      'financial stress': ['money', 'financial', 'debt', 'bills', 'expenses', 'budget', 'income', 'financial stress']
    };
    
    // Find the most relevant topic with priority scoring
    let bestMatch = '';
    let maxScore = 0;
    
    for (const [topic, keywords] of Object.entries(topics)) {
      const score = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = topic;
      }
    }
    
    // Return the best match if found
    if (bestMatch && maxScore > 0) {
      return bestMatch;
    }
    
    // Enhanced fallback based on message characteristics
    if (lowerMessage.length < 20) {
      return 'general wellness check-in';
    } else if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why')) {
      return 'wellness guidance and support';
    } else if (lowerMessage.includes('feel') || lowerMessage.includes('feeling') || lowerMessage.includes('emotion')) {
      return 'emotional support and validation';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('advice')) {
      return 'seeking guidance and assistance';
    } else {
      return 'personal sharing and emotional support';
    }
  }

  static async detectCrisisContent(message: string): Promise<boolean> {
    try {
      if (!hasOpenAIKey || !openai) {
        return this.detectCrisisKeywords(message);
      }

      const crisisPrompt = `Analyze this message for crisis indicators (suicidal thoughts, self-harm, severe distress). Respond with only "YES" or "NO":

Message: "${message}"

Consider keywords like: suicide, kill myself, want to die, end it all, self harm, hurt myself, no reason to live, better off dead, can't take it anymore`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a crisis detection assistant. Analyze messages for crisis indicators and respond with only "YES" or "NO".' },
          { role: 'user', content: crisisPrompt }
        ],
        max_tokens: 10,
        temperature: 0.1
      });
      
      const text = completion.choices[0]?.message?.content || '';

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
      // Suicidal ideation
      'suicide', 'kill myself', 'want to die', 'end it all',
      'self harm', 'hurt myself', 'no reason to live',
      'better off dead', 'can\'t take it anymore', 'end my life',
      'don\'t want to live', 'life is not worth living',
      'not worth living', 'better off without me', 'everyone would be better',
      
      // Mental breakdown indicators
      'mental breakdown', 'breaking down', 'falling apart', 'losing it',
      'can\'t cope', 'can\'t handle this', 'overwhelmed completely',
      'having a breakdown', 'losing control', 'going crazy',
      'losing my mind', 'mental health crisis', 'emotional crisis',
      
      // Severe distress indicators
      'panic attack', 'having a panic attack', 'can\'t breathe',
      'hyperventilating', 'chest pain', 'heart racing',
      'feeling like dying', 'scared I\'m dying', 'emergency',
      'need help now', 'urgent help', 'crisis situation',
      
      // Hindi crisis keywords
      'आत्महत्या', 'खुद को मारना', 'मरना चाहता', 'जीना नहीं चाहता',
      'जिंदगी बेकार', 'कोई मतलब नहीं', 'सब ठीक हो जाएगा',
      'मैं नहीं रहना चाहता', 'सबसे बेहतर होगा', 'अब और नहीं',
      
      // Marathi crisis keywords  
      'आत्महत्या', 'स्वतःला मारणे', 'मरणे इच्छित', 'जगणे नको',
      'जीवन वाया', 'काही अर्थ नाही', 'सगळं ठीक होईल',
      'मला राहायचे नाही', 'सर्वोत्तम होईल', 'आता आणखी नाही'
    ];
    
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Enhanced crisis detection for mental breakdown situations
  static async detectMentalBreakdown(message: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<{
    isCrisis: boolean;
    crisisType: 'suicidal' | 'mental_breakdown' | 'panic_attack' | 'severe_distress' | 'none';
    severity: 'low' | 'medium' | 'high' | 'critical';
    needsImmediateSupport: boolean;
  }> {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Check for suicidal ideation (highest priority)
      const suicidalKeywords = [
        'suicide', 'kill myself', 'want to die', 'end it all',
        'self harm', 'hurt myself', 'no reason to live',
        'better off dead', 'end my life', 'don\'t want to live',
        'आत्महत्या', 'खुद को मारना', 'मरना चाहता',
        'आत्महत्या', 'स्वतःला मारणे', 'मरणे इच्छित'
      ];
      
      if (suicidalKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          isCrisis: true,
          crisisType: 'suicidal',
          severity: 'critical',
          needsImmediateSupport: true
        };
      }
      
      // Check for mental breakdown indicators
      const breakdownKeywords = [
        'mental breakdown', 'breaking down', 'falling apart', 'losing it',
        'can\'t cope', 'can\'t handle this', 'overwhelmed completely',
        'having a breakdown', 'losing control', 'going crazy',
        'losing my mind', 'mental health crisis', 'emotional crisis',
        'मानसिक टूटन', 'टूट रहा हूं', 'बिखर रहा हूं',
        'मानसिक संकट', 'भावनात्मक संकट', 'नियंत्रण खो रहा'
      ];
      
      if (breakdownKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          isCrisis: true,
          crisisType: 'mental_breakdown',
          severity: 'high',
          needsImmediateSupport: true
        };
      }
      
      // Check for panic attack indicators
      const panicKeywords = [
        'panic attack', 'having a panic attack', 'can\'t breathe',
        'hyperventilating', 'chest pain', 'heart racing',
        'feeling like dying', 'scared I\'m dying', 'can\'t calm down',
        'पैनिक अटैक', 'सांस नहीं आ रही', 'दिल तेज धड़क रहा',
        'पॅनिक अटॅक', 'श्वास येत नाही', 'हृदय वेगाने धडकत आहे'
      ];
      
      if (panicKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          isCrisis: true,
          crisisType: 'panic_attack',
          severity: 'high',
          needsImmediateSupport: true
        };
      }
      
      // Check for severe distress
      const distressKeywords = [
        'emergency', 'need help now', 'urgent help', 'crisis situation',
        'can\'t take it anymore', 'at my breaking point', 'desperate',
        'hopeless', 'helpless', 'trapped', 'stuck', 'no way out',
        'आपातकाल', 'तुरंत मदद', 'संकट', 'निराश', 'बेबस',
        'आणीबाणी', 'त्वरित मदत', 'संकट', 'निराश', 'असहाय'
      ];
      
      if (distressKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          isCrisis: true,
          crisisType: 'severe_distress',
          severity: 'medium',
          needsImmediateSupport: true
        };
      }
      
      // Check conversation history for escalating distress
      const recentMessages = conversationHistory.slice(-3);
      const hasEscalatingDistress = recentMessages.some(msg => {
        const content = msg.content.toLowerCase();
        return content.includes('getting worse') || content.includes('can\'t handle') ||
               content.includes('बिगड़ रहा') || content.includes('सहन नहीं हो रहा') ||
               content.includes('वाढत आहे') || content.includes('सहन होत नाही');
      });
      
      if (hasEscalatingDistress) {
        return {
          isCrisis: true,
          crisisType: 'severe_distress',
          severity: 'medium',
          needsImmediateSupport: true
        };
      }
      
      return {
        isCrisis: false,
        crisisType: 'none',
        severity: 'low',
        needsImmediateSupport: false
      };
    } catch (error) {
      console.error('Error detecting mental breakdown:', error);
      return {
        isCrisis: false,
        crisisType: 'none',
        severity: 'low',
        needsImmediateSupport: false
      };
    }
  }

  // Generate crisis response with immediate support
  private static async generateCrisisResponse(
    crisisDetection: {
      isCrisis: boolean;
      crisisType: 'suicidal' | 'mental_breakdown' | 'panic_attack' | 'severe_distress' | 'none';
      severity: 'low' | 'medium' | 'high' | 'critical';
      needsImmediateSupport: boolean;
    },
    language: 'en' | 'hi' | 'mr',
    userName: string
  ): Promise<AIResponse> {
    const languageText = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    
    // Generate crisis-specific response
    let crisisResponse = '';
    
    switch (crisisDetection.crisisType) {
      case 'suicidal':
        crisisResponse = language === 'hi' 
          ? `मैं आपकी बात सुनकर बहुत चिंतित हूं। आपकी जिंदगी की कीमत है और आप अकेले नहीं हैं। कृपया तुरंत किसी संकट हेल्पलाइन (988) या मानसिक स्वास्थ्य पेशेवर से संपर्क करें। यदि आप तत्काल खतरे में हैं, तो आपातकालीन सेवाओं (112) को कॉल करें।`
          : language === 'mr'
          ? `मी तुमचे ऐकत आहे आणि खूप चिंतित आहे. तुमच्या जीवनाला मूल्य आहे आणि तुम्ही एकटे नाही आहात. कृपया त्वरित कोणत्याही संकट हेल्पलाइन (988) किंवा मानसिक आरोग्य व्यावसायिकांशी संपर्क साधा. जर तुम्ही त्वरित धोक्यात आहात, तर आणीबाणी सेवा (112) कॉल करा.`
          : `I'm very concerned about what you're sharing. Your life has value and you are not alone. Please contact a crisis helpline (988) or mental health professional immediately. If you're in immediate danger, call emergency services (112).`;
        break;
        
      case 'mental_breakdown':
        crisisResponse = language === 'hi'
          ? `मैं समझता हूं कि आप बहुत कठिन समय से गुजर रहे हैं। यह ठीक है कि आप इस तरह महसूस कर रहे हैं। आपको तुरंत समर्थन की आवश्यकता है। कृपया किसी मानसिक स्वास्थ्य पेशेवर से संपर्क करें या संकट हेल्पलाइन (988) पर कॉल करें।`
          : language === 'mr'
          ? `मी समजतो की तुम्ही खूप कठीण काळातून जात आहात. तुम्हाला असे वाटणे ठीक आहे. तुम्हाला त्वरित समर्थनाची गरज आहे. कृपया कोणत्याही मानसिक आरोग्य व्यावसायिकांशी संपर्क साधा किंवा संकट हेल्पलाइन (988) कॉल करा.`
          : `I understand you're going through a very difficult time. It's okay to feel this way. You need immediate support. Please contact a mental health professional or call the crisis helpline (988).`;
        break;
        
      case 'panic_attack':
        crisisResponse = language === 'hi'
          ? `पैनिक अटैक अभिभूत करने वाला लग सकता है, लेकिन यह गुजर जाएगा। गहरी सांस लें: 4 सेकंड तक सांस अंदर लें, 4 सेकंड रोकें, 4 सेकंड तक छोड़ें। यह दोहराएं। आप सुरक्षित हैं।`
          : language === 'mr'
          ? `पॅनिक अटॅक अधिक भार वाटू शकतो, पण तो निघून जाईल. खोल श्वास घ्या: 4 सेकंद श्वास घ्या, 4 सेकंद धरा, 4 सेकंद सोडा. हे पुन्हा करा. तुम्ही सुरक्षित आहात.`
          : `Panic attacks can feel overwhelming, but they will pass. Take deep breaths: Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds. Repeat this. You are safe.`;
        break;
        
      case 'severe_distress':
        crisisResponse = language === 'hi'
          ? `आप अभी तीव्र भावनाओं का अनुभव कर रहे हैं। यह क्षण गुजर जाएगा। आपको समर्थन की आवश्यकता है। कृपया किसी भरोसेमंद व्यक्ति से बात करें या मानसिक स्वास्थ्य पेशेवर से संपर्क करें।`
          : language === 'mr'
          ? `तुम्ही आता तीव्र भावना अनुभवत आहात. हा क्षण निघून जाईल. तुम्हाला समर्थनाची गरज आहे. कृपया कोणत्याही विश्वासू व्यक्तीशी बोला किंवा मानसिक आरोग्य व्यावसायिकांशी संपर्क साधा.`
          : `You're experiencing intense emotions right now. This moment will pass. You need support. Please talk to someone you trust or contact a mental health professional.`;
        break;
        
      default:
        crisisResponse = language === 'hi'
          ? `मैं आपकी मदद के लिए यहाँ हूं। कृपया तुरंत समर्थन लें।`
          : language === 'mr'
          ? `मी तुमची मदत करण्यासाठी येथे आहे. कृपया त्वरित समर्थन घ्या.`
          : `I'm here to help you. Please reach out for immediate support.`;
    }

    return {
      text: crisisResponse,
      tokensIn: 0,
      tokensOut: crisisResponse.length / 4,
      shouldSuggestVideos: true, // Always suggest crisis videos
      isCrisisResponse: true,
      crisisType: crisisDetection.crisisType,
      crisisSeverity: crisisDetection.severity
    };
  }

  // Method to get API statistics for monitoring
  static getApiStats() {
    return {
      ...this.apiStats,
      successRate: this.apiStats.totalRequests > 0 ? 
        (this.apiStats.successfulRequests / this.apiStats.totalRequests * 100).toFixed(2) + '%' : '0%',
      fallbackRate: this.apiStats.totalRequests > 0 ? 
        (this.apiStats.fallbackUsed / this.apiStats.totalRequests * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Method to reset API statistics
  static resetApiStats() {
    this.apiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      lastError: null,
      lastErrorTime: null
    };
  }
}

