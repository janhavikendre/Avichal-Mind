const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Session } = require('../src/models/session');
const { Message } = require('../src/models/message');
const { Summary } = require('../src/models/summary');

async function testSummaryGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all sessions with messages but no summaries
    const sessionsWithoutSummaries = await Session.find({
      messageCount: { $gt: 0 },
      $or: [
        { summary: { $exists: false } },
        { summary: null },
        { summary: '' }
      ]
    }).sort({ startedAt: -1 });

    console.log(`Found ${sessionsWithoutSummaries.length} sessions without summaries`);

    for (const session of sessionsWithoutSummaries) {
      console.log(`\n--- Session ${session._id} ---`);
      console.log(`User: ${session.userId}`);
      console.log(`Messages: ${session.messageCount}`);
      console.log(`Language: ${session.language}`);
      console.log(`Started: ${session.startedAt}`);
      
      // Get messages for this session
      const messages = await Message.find({ sessionId: session._id }).sort({ createdAt: 1 });
      console.log(`Actual messages in DB: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log(`First user message: "${messages.find(m => m.role === 'user')?.contentText?.substring(0, 100)}..."`);
        console.log(`Last assistant message: "${messages.filter(m => m.role === 'assistant').pop()?.contentText?.substring(0, 100)}..."`);
      }
    }

    // Also check existing summaries
    const existingSummaries = await Summary.find({});
    console.log(`\nExisting summaries in database: ${existingSummaries.length}`);
    
    for (const summary of existingSummaries) {
      console.log(`- Session ${summary.sessionId}: ${summary.content?.substring(0, 100)}...`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSummaryGeneration();
