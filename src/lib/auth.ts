import { User } from '@/models/user';

export async function getOrCreateUser(clerkUserId: string) {
  console.log('🔍 Looking for user with clerkUserId:', clerkUserId);
  
  if (!clerkUserId) {
    throw new Error('clerkUserId is required');
  }
  
  let user = await User.findOne({ clerkUserId });
  console.log('🔍 User found in database:', user ? 'Yes' : 'No');
  
  if (!user) {
    console.log('🔍 User not found, creating new user...');
    try {
      // Check if CLERK_SECRET_KEY is available
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error('CLERK_SECRET_KEY environment variable is not set');
      }
      
      // Get user info from Clerk
      console.log('🔍 Fetching user from Clerk API...');
      const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${clerkUserId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Clerk API response status:', clerkResponse.status);
      
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
          userType: 'clerk',
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
            totalMinutes: 0,
            crisisSessions: 0,
            firstSessionDate: null,
            lastSessionDate: null,
            languagesUsed: [],
            modesUsed: []
          }
        });
        console.log('🔍 Saving user to database...');
        await user.save();
        console.log('✅ User created in database:', user._id);
      } else {
        const errorText = await clerkResponse.text();
        console.error('❌ Failed to fetch user from Clerk:', {
          status: clerkResponse.status,
          statusText: clerkResponse.statusText,
          error: errorText
        });
        
        if (clerkResponse.status === 401) {
          throw new Error('Invalid Clerk API key. Please check your CLERK_SECRET_KEY.');
        }
        
        if (clerkResponse.status === 404) {
          throw new Error('User not found in Clerk. Please check the clerkUserId.');
        }
        
        throw new Error(`Clerk API error: ${clerkResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
      
      // Re-throw with more context
      if (error instanceof Error && error.message.includes('CLERK_SECRET_KEY')) {
        throw new Error('Clerk configuration error: ' + error.message);
      }
      
      if (error instanceof Error && error.message.includes('Clerk API error')) {
        throw new Error('Clerk API error: ' + error.message);
      }
      
      if (error instanceof Error) {
        throw new Error('Failed to create user: ' + error.message);
      }
      throw new Error('Failed to create user');
    }
  } else {
    // Check if existing user has missing required fields
    let needsUpdate = false;
    
    // Check for missing firstName
    if (!user.firstName) {
      console.log('🔍 User has missing firstName, fetching from Clerk...');
      try {
        // Fetch fresh data from Clerk
        const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${clerkUserId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (clerkResponse.ok) {
          const clerkUser = await clerkResponse.json();
          user.firstName = clerkUser.first_name || user.firstName || 'User';
          user.lastName = clerkUser.last_name || user.lastName || '';
          needsUpdate = true;
          console.log('✅ Updated user with Clerk data:', { firstName: user.firstName, lastName: user.lastName });
        }
      } catch (error) {
        console.error('❌ Failed to fetch user data from Clerk for update:', error);
        // Set default values if we can't fetch from Clerk
        user.firstName = user.firstName || 'User';
        user.lastName = user.lastName || '';
        needsUpdate = true;
      }
    }
    
    // Initialize gamification fields for existing users if they don't exist
    if (!user.points) {
      user.points = 0;
      needsUpdate = true;
    }
    
    if (!user.level) {
      user.level = 1;
      needsUpdate = true;
    }
    
    if (user.streak === undefined || user.streak === null) {
      user.streak = 0;
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
        totalMinutes: 0,
        crisisSessions: 0,
        firstSessionDate: null,
        lastSessionDate: null
      };
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      try {
        await user.save();
        console.log('🔍 Updated existing user with missing fields');
      } catch (updateError: unknown) {
        console.error('❌ Error updating existing user:', updateError);
        if (updateError instanceof Error) {
          throw new Error('Failed to update existing user: ' + updateError.message);
        }
        throw new Error('Failed to update existing user');
      }
    }
  }
  return user;
}
