const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkSummaries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all summaries with user info
    const summaries = await mongoose.connection.db.collection('summaries').find({}).toArray();
    console.log(`\nFound ${summaries.length} summaries:`);
    
    summaries.forEach((summary, index) => {
      console.log(`${index + 1}. Summary ID: ${summary._id}`);
      console.log(`   Session ID: ${summary.sessionId}`);
      console.log(`   User ID: ${summary.userId}`);
      console.log(`   Language: ${summary.language}`);
      console.log(`   Content: ${summary.content.substring(0, 100)}...`);
      console.log(`   Quality Score: ${summary.quality.score}`);
      console.log('');
    });

    // Get user info
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`\nFound ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user._id}`);
      console.log(`   Clerk ID: ${user.clerkUserId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSummaries();
