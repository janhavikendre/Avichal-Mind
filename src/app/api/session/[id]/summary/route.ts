import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import SessionModel from '@/models/session';
import MessageModel from '@/models/message';
import { geminiService } from '@/lib/gemini';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const sessionId = params.id;

    const session = await SessionModel.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch messages for transcript
    const messages = await MessageModel.find({ sessionId }).sort({ createdAt: 1 }).lean();
    const transcript = messages
      .map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.contentText}`)
      .join('\n');

    const prompt = `Create a concise, empathetic 5-7 sentence summary of this mental wellness conversation in the user's language. Avoid PII, avoid diagnoses. Offer 2-3 actionable next steps.\n\nTranscript:\n${transcript}`;

    const ai = await geminiService.generateResponse([
      { role: 'user', content: prompt }
    ], session.language as any);

    const summaryText = ai?.trim?.() || ai || 'Summary unavailable.';

    session.summary = summaryText;
    await session.save();

    return NextResponse.json({ ok: true, summary: summaryText });
  } catch (err) {
    console.error('Summary generation error', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}


