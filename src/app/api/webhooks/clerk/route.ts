import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/user';

export async function POST(req: Request) {
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
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
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

  // Handle the webhook
  if (eventType === 'user.created') {
    try {
      await connectDB();
      
      const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';

      if (email) {
        // Check if user already exists
        const existingUser = await User.findOne({ clerkUserId });
        if (!existingUser) {
          const user = new User({
            clerkUserId,
            email,
            name,
            preferences: {
              language: 'en',
              voiceEnabled: true,
              notifications: true,
            },
          });
          await user.save();
          console.log('User created in database:', user._id);
        }
      }
    } catch (error) {
      console.error('Error creating user in database:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    try {
      await connectDB();
      
      const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';

      if (email) {
        await User.findOneAndUpdate(
          { clerkUserId },
          { email, name },
          { upsert: true }
        );
        console.log('User updated in database:', clerkUserId);
      }
    } catch (error) {
      console.error('Error updating user in database:', error);
      return new Response('Error updating user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await connectDB();
      
      const { id: clerkUserId } = evt.data;
      await User.findOneAndDelete({ clerkUserId });
      console.log('User deleted from database:', clerkUserId);
    } catch (error) {
      console.error('Error deleting user from database:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}
