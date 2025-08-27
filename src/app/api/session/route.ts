import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { z } from 'zod';

const createSessionSchema = z.object({
  mode: z.enum(['text', 'voice']),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('🔍 Clerk userId in POST /api/session:', userId);
    console.log('🔍 Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (!userId) {
      console.log('❌ No userId from auth() - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    // Get or create user
    console.log('🔍 Getting or creating user with clerkUserId:', userId);
    const user = await getOrCreateUser(userId);
    console.log('✅ User found/created:', user ? user._id : 'null');

    const body = await request.json();
    const { mode, language } = createSessionSchema.parse(body);

    const session = new Session({
      userId: user._id,
      mode,
      language,
      startedAt: new Date(),
    });

    await session.save();

    return NextResponse.json({
      id: session._id,
      mode: session.mode,
      language: session.language,
      startedAt: session.startedAt,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await getOrCreateUser(userId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ userId: user._id })
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const total = await Session.countDocuments({ userId: user._id });

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
