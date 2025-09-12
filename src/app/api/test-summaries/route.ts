import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { Summary } from '@/models/summary';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await currentUser();
    console.log('Current user from Clerk:', {
      id: user?.id,
      email: user?.emailAddresses?.[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - no user' }, { status: 401 });
    }

    // Find user in database
    const { User } = await import('@/models/user');
    const dbUser = await User.findOne({ clerkUserId: user.id });
    console.log('Database user:', {
      id: dbUser?._id,
      clerkUserId: dbUser?.clerkUserId,
      email: dbUser?.email
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Get summaries for this user
    const summaries = await Summary.find({ userId: dbUser._id }).lean();
    console.log(`Found ${summaries.length} summaries for user ${dbUser._id}`);

    // Get all summaries to compare
    const allSummaries = await Summary.find({}).lean();
    console.log(`Total summaries in database: ${allSummaries.length}`);

    return NextResponse.json({
      currentUser: {
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        dbUserId: dbUser._id
      },
      userSummaries: summaries.length,
      totalSummaries: allSummaries.length,
      summaries: summaries.map(s => ({
        id: s._id,
        sessionId: s.sessionId,
        language: s.language,
        content: s.content.substring(0, 100) + '...',
        generatedAt: s.generatedAt
      }))
    });

  } catch (error) {
    console.error('Error in test summaries endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
