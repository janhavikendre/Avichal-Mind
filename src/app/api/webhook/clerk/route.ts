import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';

export async function POST(request: NextRequest) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error occured -- no svix headers', {
        status: 400
      });
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response('Error occured', {
        status: 400
      });
    }

    // Get the ID and type
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
    console.log('Webhook body:', body);

    // Handle the webhook
    if (eventType === 'user.created') {
      await connectDB();
      
      const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses[0]?.email_address;
      const firstName = first_name || 'User';
      const lastName = last_name || '';

      // Check if user already exists
      const existingUser = await User.findOne({ clerkUserId });
      if (existingUser) {
        console.log('User already exists:', existingUser.email);
        return NextResponse.json({ message: 'User already exists' });
      }

      // Create new user
      const user = new User({
        clerkUserId,
        email,
        firstName,
        lastName,
        userType: 'clerk',
        points: 0,
        level: 1,
        streak: 0,
        badges: [],
        achievements: [],
        stats: {
          totalSessions: 0,
          totalMessages: 0,
          totalMinutes: 0,
          crisisSessions: 0
        }
      });

      await user.save();
      console.log('User created:', user.email);
    }

    if (eventType === 'user.updated') {
      await connectDB();
      
      const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses[0]?.email_address;
      const firstName = first_name || 'User';
      const lastName = last_name || '';

      // Update user
      await User.findOneAndUpdate(
        { clerkUserId },
        { 
          email,
          firstName,
          lastName,
          updatedAt: new Date()
        },
        { new: true }
      );

      console.log('User updated:', email);
    }

    if (eventType === 'user.deleted') {
      await connectDB();
      
      const { id: clerkUserId } = evt.data;

      // Delete user and all associated data
      await User.findOneAndDelete({ clerkUserId });
      
      console.log('User deleted:', clerkUserId);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
