import { User } from '@/models/user';

export async function getOrCreateUser(clerkUserId: string) {
  console.log('🔍 Looking for user with clerkUserId:', clerkUserId);
  let user = await User.findOne({ clerkUserId });
  console.log('🔍 User found in database:', user ? 'Yes' : 'No');
  
  if (!user) {
    console.log('🔍 User not found, creating new user...');
    try {
      // Get user info from Clerk
      console.log('🔍 Fetching user from Clerk API...');
      const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${clerkUserId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (clerkResponse.ok) {
        const clerkUser = await clerkResponse.json();
        console.log('✅ Clerk user data received:', {
          id: clerkUser.id,
          email: clerkUser.email_addresses?.[0]?.email_address,
          name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim()
        });
        
        const email = clerkUser.email_addresses?.[0]?.email_address || '';
        const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 'User';
        
        console.log('🔍 Creating user with data:', { clerkUserId, email, name });
        user = new User({
          clerkUserId,
          email,
          name,
          preferences: {
            language: 'en',
            voiceEnabled: true,
            notifications: true,
          },
        });
        console.log('🔍 Saving user to database...');
        await user.save();
        console.log('✅ User created in database:', user._id);
      } else {
        console.error('Failed to fetch user from Clerk:', await clerkResponse.text());
        throw new Error('Failed to fetch user from Clerk');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  return user;
}
