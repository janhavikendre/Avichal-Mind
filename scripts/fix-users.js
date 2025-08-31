#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// User Schema (simplified for the script)
const userSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastSessionDate: { type: Date, default: null }
  },
  badges: [{ type: Object }],
  achievements: [{ type: Object }],
  stats: {
    totalSessions: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    languagesUsed: [{ type: String }],
    modesUsed: [{ type: String }],
    firstSessionDate: { type: Date },
    lastSessionDate: { type: Date }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function fixUsers() {
  try {
    console.log('🔍 Finding users with missing firstName or lastName...');
    
    // Find users with missing firstName or lastName
    const usersToFix = await User.find({
      $or: [
        { firstName: { $exists: false } },
        { firstName: null },
        { firstName: '' },
        { lastName: { $exists: false } },
        { lastName: null },
        { lastName: '' }
      ]
    });
    
    console.log(`📊 Found ${usersToFix.length} users that need fixing`);
    
    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing!');
      return;
    }
    
    // Fix each user
    for (const user of usersToFix) {
      console.log(`🔧 Fixing user: ${user.clerkUserId}`);
      
      try {
        // Try to fetch user data from Clerk
        const clerkResponse = await fetch(`https://api.clerk.dev/v1/users/${user.clerkUserId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (clerkResponse.ok) {
          const clerkUser = await clerkResponse.json();
          user.firstName = clerkUser.first_name || 'Unknown';
          user.lastName = clerkUser.last_name || 'User';
          console.log(`✅ Updated user with Clerk data: ${user.firstName} ${user.lastName}`);
        } else {
          // Set default values if we can't fetch from Clerk
          user.firstName = user.firstName || 'Unknown';
          user.lastName = user.lastName || 'User';
          console.log(`⚠️  Set default values for user: ${user.firstName} ${user.lastName}`);
        }
        
        // Ensure other required fields exist
        if (!user.points) user.points = 0;
        if (!user.level) user.level = 1;
        if (!user.streak) {
          user.streak = {
            current: 0,
            longest: 0,
            lastSessionDate: null
          };
        }
        if (!user.badges) user.badges = [];
        if (!user.achievements) user.achievements = [];
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
        }
        
        await user.save();
        console.log(`✅ Successfully fixed user: ${user.clerkUserId}`);
        
      } catch (error) {
        console.error(`❌ Failed to fix user ${user.clerkUserId}:`, error.message);
      }
    }
    
    console.log('🎉 User fixing completed!');
    
  } catch (error) {
    console.error('❌ Error during user fixing:', error);
  }
}

async function main() {
  await connectDB();
  await fixUsers();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);
