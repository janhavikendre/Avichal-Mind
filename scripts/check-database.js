const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count all sessions
    const sessionCount = await mongoose.connection.db.collection('sessions').countDocuments();
    console.log(`Total sessions in database: ${sessionCount}`);

    // Get sample sessions
    const sessions = await mongoose.connection.db.collection('sessions').find({}).limit(5).toArray();
    console.log('Sample sessions:', sessions.map(s => ({
      id: s._id,
      userId: s.userId,
      mode: s.mode,
      language: s.language,
      startedAt: s.startedAt,
      completedAt: s.completedAt
    })));

    // Count all messages
    const messageCount = await mongoose.connection.db.collection('messages').countDocuments();
    console.log(`Total messages in database: ${messageCount}`);

    // Count all summaries
    const summaryCount = await mongoose.connection.db.collection('summaries').countDocuments();
    console.log(`Total summaries in database: ${summaryCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSessions();
