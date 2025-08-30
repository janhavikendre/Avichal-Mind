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
          firstName: clerkUser.first_name,
          lastName: clerkUser.last_name
        });
        
        const email = clerkUser.email_addresses?.[0]?.email_address || '';
        const firstName = clerkUser.first_name || '';
        const lastName = clerkUser.last_name || '';
        
        console.log('🔍 Creating user with data:', { clerkUserId, email, firstName, lastName });
        user = new User({
          clerkUserId,
          email,
          firstName,
          lastName,
          // Initialize gamification fields
          points: 0,
          level: 1,
          streak: {
            current: 0,
            longest: 0,
            lastSessionDate: null
          },
          badges: [],
          achievements: [],
          stats: {
            totalSessions: 0,
            totalMessages: 0,
            totalDuration: 0,
            languagesUsed: [],
            modesUsed: [],
            firstSessionDate: null,
            lastSessionDate: null
          }
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
  } else {
    // Initialize gamification fields for existing users if they don't exist
    let needsUpdate = false;
    
    if (!user.points) {
      user.points = 0;
      needsUpdate = true;
    }
    
    if (!user.level) {
      user.level = 1;
      needsUpdate = true;
    }
    
    if (!user.streak) {
      user.streak = {
        current: 0,
        longest: 0,
        lastSessionDate: null
      };
      needsUpdate = true;
    }
    
    if (!user.badges) {
      user.badges = [];
      needsUpdate = true;
    }
    
    if (!user.achievements) {
      user.achievements = [];
      needsUpdate = true;
    }
    
    if (!user.stats) {
      user.stats = {
        totalSessions: 0,
        totalMessages: 0,
        totalDuration: 0,
        languagesUsed: [],
        modesUsed: [],
        firstSessionDate: null,
        lastSessionDate: null
      };
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await user.save();
      console.log('🔍 Updated existing user with gamification fields');
    }
  }
  
  return user;
}
