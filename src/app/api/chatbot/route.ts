import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai';

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'en', conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate AI response using the same service as other chat interfaces
    const aiResponse = await AIService.generateResponse(
      message,
      language as 'en' | 'hi' | 'mr',
      'User', // Default user name for landing page
      conversationHistory
    );

    return NextResponse.json({
      text: aiResponse.text,
      shouldSuggestVideos: aiResponse.shouldSuggestVideos,
      videos: aiResponse.videos || [],
      isCrisisResponse: aiResponse.isCrisisResponse || false
    });

  } catch (error) {
    console.error('Error in chatbot API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
      },
      { status: 500 }
    );
  }
}
