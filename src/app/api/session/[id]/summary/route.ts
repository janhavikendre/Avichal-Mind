import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { Session as SessionModel } from '@/models/session';
import { Message as MessageModel } from '@/models/message';
import { User } from '@/models/user';
import { geminiService } from '@/lib/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { phoneUserId } = body;

    // Check if user is authenticated (either Clerk or phone user)
    if (!userId && !phoneUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let user;
    if (userId) {
      // For Clerk users, we don't need to fetch the user here
      user = { _id: 'clerk_user' };
    } else if (phoneUserId) {
      // Phone user
      user = await User.findById(phoneUserId);
      if (!user) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
    }

    const sessionId = params.id;

    const session = await SessionModel.findOne({
      _id: sessionId,
      userId: user._id
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch messages for transcript
    const messages = await MessageModel.find({ sessionId }).sort({ createdAt: 1 }).lean();
    const transcript = messages
      .map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.contentText}`)
      .join('\n');

    const prompt = `Create a concise, empathetic 5-7 sentence summary of this mental wellness conversation in the user's language. Avoid PII, avoid diagnoses. Offer 2-3 actionable next steps.\n\nTranscript:\n${transcript}`;

    const ai = await geminiService.generateResponse(prompt, session.language as any);

    const summaryText = ai?.trim?.() || ai || 'Summary unavailable.';

    session.summary = summaryText;
    await session.save();

    return NextResponse.json({ ok: true, summary: summaryText });
  } catch (err) {
    console.error('Summary generation error', err);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}


