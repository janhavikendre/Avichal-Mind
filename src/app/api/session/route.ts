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
    console.log('🚀 Starting session creation...');
    console.log('🔍 Environment check - NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 Environment check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('🔍 Environment check - CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
    
    const { userId } = await auth();
    console.log('🔍 Clerk userId in POST /api/session:', userId);
    
    if (!userId) {
      console.log('❌ No userId from auth() - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Connecting to database...');
    try {
      await connectDB();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }

    // Get or create user
    console.log('🔍 Getting or creating user with clerkUserId:', userId);
    let user;
    try {
      user = await getOrCreateUser(userId);
      console.log('✅ User found/created:', user ? user._id : 'null');
    } catch (userError) {
      console.error('❌ User creation/fetch failed:', userError);
      return NextResponse.json({ 
        error: 'User authentication failed',
        details: process.env.NODE_ENV === 'development' ? userError.message : undefined
      }, { status: 500 });
    }

    if (!user) {
      console.log('❌ User is null after getOrCreateUser');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    let validatedData;
    try {
      validatedData = createSessionSchema.parse(body);
      console.log('✅ Request data validated:', validatedData);
    } catch (validationError) {
      console.error('❌ Request validation failed:', validationError);
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: process.env.NODE_ENV === 'development' ? validationError.message : undefined
      }, { status: 400 });
    }

    const { mode, language } = validatedData;

    console.log('🔍 Creating session with data:', { userId: user._id, mode, language });
    const session = new Session({
      userId: user._id,
      mode,
      language,
      startedAt: new Date(),
    });

    try {
      await session.save();
      console.log('✅ Session saved successfully:', session._id);
    } catch (saveError) {
      console.error('❌ Session save failed:', saveError);
      return NextResponse.json({ 
        error: 'Failed to save session',
        details: process.env.NODE_ENV === 'development' ? saveError.message : undefined
      }, { status: 500 });
    }

    const response = {
      id: session._id,
      mode: session.mode,
      language: session.language,
      startedAt: session.startedAt,
    };

    console.log('✅ Session creation completed successfully:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Unexpected error in session creation:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Check for specific error types
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined
      }, { status: 400 });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.error('❌ MongoDB error:', error);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
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
