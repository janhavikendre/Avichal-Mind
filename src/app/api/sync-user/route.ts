import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ clerkUserId: userId });
    
    if (!user) {
      // Get user info from Clerk
      const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (clerkResponse.ok) {
        const clerkUser = await clerkResponse.json();
        const email = clerkUser.email_addresses?.[0]?.email_address || '';
        const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 'User';
        
        user = new User({
          clerkUserId: userId,
          email,
          name,
          preferences: {
            language: 'en',
            voiceEnabled: true,
            notifications: true,
          },
        });
        await user.save();
        console.log('User synced to database:', user._id);
        
        return NextResponse.json({
          success: true,
          message: 'User synced successfully',
          user: {
            id: user._id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            name: user.name,
          }
        });
      } else {
        console.error('Failed to fetch user from Clerk:', await clerkResponse.text());
        return NextResponse.json({ error: 'Failed to fetch user from Clerk' }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: 'User already exists in database',
        user: {
          id: user._id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          name: user.name,
        }
      });
    }
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
