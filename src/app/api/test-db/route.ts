import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    console.log('🔍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('🔍 MONGODB_URI preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'Not set');
    
    await connectDB();
    
    // Try to count users
    const userCount = await User.countDocuments();
    console.log('🔍 Total users in database:', userCount);
    
    // List all users
    const users = await User.find({}).limit(5);
    console.log('🔍 Sample users:', users.map(u => ({ id: u._id, clerkUserId: u.clerkUserId, email: u.email })));
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      userCount,
      sampleUsers: users.map(u => ({
        id: u._id,
        clerkUserId: u.clerkUserId,
        email: u.email,
        name: u.name
      }))
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
