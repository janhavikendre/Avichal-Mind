import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai';

export async function GET() {
  try {
    console.log('Testing AIService...');
    console.log('OpenAI API key available:', !!process.env.OPENAI_API_KEY);
    
    // Test with a simple conversation
    const testMessages = [
      { role: 'user' as const, content: 'Hello, I am feeling stressed' },
      { role: 'assistant' as const, content: 'I understand you are feeling stressed. Let me help you with some breathing exercises.' }
    ];
    
    const summary = await AIService.generateSessionSummary(testMessages, 'en');
    
    return NextResponse.json({
      success: true,
      summary: summary,
      apiKeyAvailable: !!process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.error('AIService test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyAvailable: !!process.env.OPENAI_API_KEY
    }, { status: 500 });
  }
}
