const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testUserSummaries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the user with the summary
    const userWithSummary = await mongoose.connection.db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId('68af36c67f4bd94df603e555')
    });
    
    console.log('User with summary:');
    console.log(`- User ID: ${userWithSummary._id}`);
    console.log(`- Clerk ID: ${userWithSummary.clerkUserId}`);
    console.log(`- Email: ${userWithSummary.email}`);
    console.log(`- Name: ${userWithSummary.firstName} ${userWithSummary.lastName}`);

    // Get their summary
    const userSummary = await mongoose.connection.db.collection('summaries').findOne({
      userId: new mongoose.Types.ObjectId('68af36c67f4bd94df603e555')
    });
    
    console.log('\nSummary for this user:');
    console.log(`- Summary ID: ${userSummary._id}`);
    console.log(`- Language: ${userSummary.language}`);
    console.log(`- Content: ${userSummary.content}`);
    console.log(`- Quality Score: ${userSummary.quality.score}`);

    // Get session for this summary
    const session = await mongoose.connection.db.collection('sessions').findOne({
      _id: userSummary.sessionId
    });
    
    console.log('\nCorresponding session:');
    console.log(`- Session ID: ${session._id}`);
    console.log(`- Started: ${session.startedAt}`);
    console.log(`- Completed: ${session.completedAt}`);
    console.log(`- Mode: ${session.mode}`);
    console.log(`- Language: ${session.language}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserSummaries();
