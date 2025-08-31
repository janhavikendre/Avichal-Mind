import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';
import { Session } from '@/models/session';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection and environment...');
    
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'Set' : 'Not set',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set',
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    // Test database connection
    let dbStatus = 'Not tested';
    let userCount = 0;
    let sessionCount = 0;
    
    try {
      await connectDB();
      dbStatus = 'Connected';
      
      // Test basic operations
      userCount = await User.countDocuments();
      sessionCount = await Session.countDocuments();
      
      console.log('✅ Database test successful');
    } catch (dbError: unknown) {
      dbStatus = `Error: ${(dbError as Error).message}`;
      console.error('❌ Database test failed:', dbError);
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount,
        sessionCount
      },
      message: 'Database test completed'
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: (error as Error).message 
    }, { status: 500 });
  }
}
