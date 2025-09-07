import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Session } from '@/models/session';
import { User } from '@/models/user';
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
    const body = await request.json();
    const { phoneUserId } = body;
    
    console.log('🔍 Clerk userId in POST /api/session:', userId);
    console.log('🔍 Phone userId in POST /api/session:', phoneUserId);
    
    // Check if user is authenticated (either Clerk or phone user)
    if (!userId && !phoneUserId) {
      console.log('❌ No userId from auth() or phoneUserId - returning 401');
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
        details: process.env.NODE_ENV === 'development' ? (dbError as Error).message : undefined
      }, { status: 500 });
    }

    // Get or create user
    let user;
    if (userId) {
      // Clerk user
      console.log('🔍 Getting or creating Clerk user with clerkUserId:', userId);
      try {
        user = await getOrCreateUser(userId);
        console.log('✅ Clerk user found/created:', user ? user._id : 'null');
      } catch (userError) {
        console.error('❌ Clerk user creation/fetch failed:', userError);
        return NextResponse.json({ 
          error: 'User authentication failed',
          details: process.env.NODE_ENV === 'development' ? (userError as Error).message : undefined
        }, { status: 500 });
      }
    } else if (phoneUserId) {
      // Phone user
      console.log('🔍 Getting phone user with userId:', phoneUserId);
      try {
        user = await User.findById(phoneUserId);
        if (!user) {
          console.log('❌ Phone user not found');
          return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
        }
        console.log('✅ Phone user found:', user._id);
      } catch (userError) {
        console.error('❌ Phone user fetch failed:', userError);
        return NextResponse.json({ 
          error: 'Phone user authentication failed',
          details: process.env.NODE_ENV === 'development' ? (userError as Error).message : undefined
        }, { status: 500 });
      }
    }

    if (!user) {
      console.log('❌ User is null after getOrCreateUser');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user has the required structure for gamification (migrate old users)
    if (!user.stats) {
      user.stats = {
        totalSessions: 0,
        totalMessages: 0,
        totalMinutes: 0,
        crisisSessions: 0,
        firstSessionDate: null,
        lastSessionDate: null,
        languagesUsed: [],
        modesUsed: []
      };
    }
    
    if (!user.stats.languagesUsed) {
      user.stats.languagesUsed = [];
    }
    
    if (!user.stats.modesUsed) {
      user.stats.modesUsed = [];
    }
    
    if (!user.streak || typeof user.streak === 'number') {
      user.streak = {
        current: typeof user.streak === 'number' ? user.streak : 0,
        longest: typeof user.streak === 'number' ? user.streak : 0,
        lastSessionDate: null
      };
    }

    let validatedData;
    try {
      validatedData = createSessionSchema.parse(body);
      console.log('✅ Request data validated:', validatedData);
    } catch (validationError) {
      console.error('❌ Request validation failed:', validationError);
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: process.env.NODE_ENV === 'development' ? (validationError as Error).message : undefined
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
        details: process.env.NODE_ENV === 'development' ? (saveError as Error).message : undefined
      }, { status: 500 });
    }

    // Update user stats
    try {
      console.log('🔍 Updating user stats...');
      const updateData: any = {
        $inc: { 'stats.totalSessions': 1 },
        $set: { 'stats.lastSessionDate': new Date() }
      };

      // Add language to languagesUsed if not already present
      if (!user.stats.languagesUsed || !user.stats.languagesUsed.includes(language)) {
        updateData.$addToSet = { 'stats.languagesUsed': language };
      }

      // Add mode to modesUsed if not already present
      if (!user.stats.modesUsed || !user.stats.modesUsed.includes(mode)) {
        if (updateData.$addToSet) {
          updateData.$addToSet['stats.modesUsed'] = mode;
        } else {
          updateData.$addToSet = { 'stats.modesUsed': mode };
        }
      }

      // Set firstSessionDate if this is the first session
      if (!user.stats.firstSessionDate) {
        updateData.$set['stats.firstSessionDate'] = new Date();
      }

      await User.findByIdAndUpdate(user._id, updateData);
      console.log('✅ User stats updated successfully');
    } catch (statsError) {
      console.error('❌ Failed to update user stats:', statsError);
      // Don't fail the session creation if stats update fails
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
    console.error('❌ Error stack:', (error as Error).stack);
    
    // Check for specific error types
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined
      }, { status: 400 });
    }
    
    if ((error as any).name === 'MongoError' || (error as any).name === 'MongooseError') {
      console.error('❌ MongoDB error:', error);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const phoneUserId = searchParams.get('phoneUserId');

    // Check if user is authenticated (either Clerk or phone user)
    if (!userId && !phoneUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let user;
    if (userId) {
      // Clerk user
      user = await getOrCreateUser(userId);
    } else if (phoneUserId) {
      // Phone user
      user = await User.findById(phoneUserId);
      if (!user) {
        return NextResponse.json({ error: 'Phone user not found' }, { status: 404 });
      }
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Increased limit to show all sessions
    const skip = (page - 1) * limit;
    const debug = searchParams.get('debug') === 'true';

    console.log(`🔍 Fetching sessions for user ${user._id}, page: ${page}, limit: ${limit}, skip: ${skip}, debug: ${debug}`);

    // If debug mode, show all sessions regardless of user
    const query = debug ? {} : { userId: user._id };
    
    const sessions = await Session.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const total = await Session.countDocuments(query);

    console.log(`✅ Found ${sessions.length} sessions out of ${total} total sessions`);
    console.log(`📅 Session dates:`, sessions.map(s => ({
      id: s._id,
      userId: s.userId,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      summary: s.summary ? 'Has summary' : 'No summary'
    })));

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
