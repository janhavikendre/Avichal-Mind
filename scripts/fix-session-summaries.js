const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Session and Message models
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['text', 'voice'], required: true },
  language: { type: String, enum: ['en', 'hi', 'mr'], required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  summary: { type: String },
  safetyFlags: {
    crisis: { type: Boolean, default: false },
    pii: { type: Boolean, default: false }
  },
  messageCount: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }
});

const MessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  contentText: { type: String, required: true },
  contentAudioUrl: { type: String },
  tokensIn: { type: Number, default: 0 },
  tokensOut: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', SessionSchema);
const Message = mongoose.model('Message', MessageSchema);

// Simple language detection function
function detectSessionLanguage(messages) {
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  let hindiCount = 0;
  let englishCount = 0;
  
  for (const message of userMessages) {
    const content = message.contentText;
    
    // Count Hindi characters
    const hindiChars = (content.match(/[\u0900-\u097F]/g) || []).length;
    hindiCount += hindiChars;
    
    // Count English characters
    const englishChars = (content.match(/[a-zA-Z]/g) || []).length;
    englishCount += englishChars;
  }
  
  console.log(`Language detection counts - Hindi: ${hindiCount}, English: ${englishCount}`);
  
  // If significant Hindi characters found, return Hindi
  if (hindiCount > 5) {
    console.log('Language detected: Hindi (based on Devanagari characters)');
    return 'hi';
  }
  
  // If mostly English characters, return English
  if (englishCount > 10 && hindiCount < 3) {
    console.log('Language detected: English (based on English characters)');
    return 'en';
  }
  
  // Default to English if unclear
  console.log('Language detection unclear, defaulting to English');
  return 'en';
}

// Simple summary generation function
function generateFallbackSummary(messages, language) {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  // Get the main topic from the first user message
  const firstUserMessage = userMessages[0]?.contentText || '';
  const mainTopic = extractMainTopic(firstUserMessage);
  
  if (language === 'hi') {
    if (mainTopic) {
      return `जान्हवी ने ${mainTopic} के बारे में चर्चा की। ${assistantMessages.length} सहायक सुझाव दिए गए।`;
    }
    return `सत्र में ${userMessages.length} विषयों पर चर्चा हुई। ${assistantMessages.length} सहायक प्रतिक्रियाएं प्रदान की गईं।`;
  } else if (language === 'mr') {
    if (mainTopic) {
      return `जान्हवी ने ${mainTopic} बद्दल चर्चा केली. ${assistantMessages.length} सहाय्यक सूचना दिल्या.`;
    }
    return `सत्रात ${userMessages.length} विषयांवर चर्चा झाली. ${assistantMessages.length} सहाय्यक प्रतिसाद दिले गेले.`;
  }
  
  // English fallback
  if (mainTopic) {
    return `Janhavi discussed ${mainTopic}. ${assistantMessages.length} supportive suggestions provided.`;
  }
  return `Session covered ${userMessages.length} topics. ${assistantMessages.length} supportive responses provided.`;
}

function extractMainTopic(message) {
  const lowerMessage = message.toLowerCase();
  
  // Define topic keywords
  const topics = {
    'stress management': ['stress', 'anxiety', 'worried', 'overwhelmed', 'tension'],
    'sleep issues': ['sleep', 'insomnia', 'tired', 'exhausted', 'rest'],
    'work pressure': ['work', 'job', 'career', 'boss', 'colleague', 'deadline'],
    'relationship problems': ['relationship', 'partner', 'family', 'friend', 'marriage'],
    'self-care': ['self care', 'wellness', 'health', 'care', 'healing'],
    'mindfulness': ['mindfulness', 'meditation', 'breathing', 'calm', 'peace'],
    'confidence issues': ['confidence', 'self-esteem', 'worth', 'believe', 'capable']
  };
  
  // Find the most relevant topic
  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return topic;
    }
  }
  
  // If no specific topic found, return a generic one based on message length
  if (lowerMessage.length < 20) {
    return 'general wellness';
  } else if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    return 'wellness guidance';
  } else {
    return 'emotional support';
  }
}

async function fixSessionSummaries() {
  try {
    await connectDB();
    
    console.log('Starting to fix session summaries...');
    
    // Get all completed sessions
    const sessions = await Session.find({ 
      completedAt: { $exists: true },
      summary: { $exists: true, $ne: null }
    }).sort({ completedAt: -1 });
    
    console.log(`Found ${sessions.length} completed sessions to process`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const session of sessions) {
      try {
        console.log(`Processing session ${session._id} (${session.language})`);
        
        // Get messages for this session
        const messages = await Message.find({ sessionId: session._id })
          .sort({ createdAt: 1 });
        
        if (messages.length === 0) {
          console.log(`No messages found for session ${session._id}, skipping`);
          continue;
        }
        
        // Detect actual session language from messages
        const actualLanguage = detectSessionLanguage(messages);
        console.log(`Session language detected: ${actualLanguage}, generating summary in ${actualLanguage === 'hi' ? 'Hindi' : actualLanguage === 'mr' ? 'Marathi' : 'English'}`);
        
        // Generate new summary with proper language detection
        const newSummary = generateFallbackSummary(messages, actualLanguage);
        
        // Check if the summary actually changed
        if (newSummary !== session.summary) {
          console.log(`Updating summary for session ${session._id}:`);
          console.log(`Old: ${session.summary}`);
          console.log(`New: ${newSummary}`);
          
          // Update the session with new summary
          session.summary = newSummary;
          await session.save();
          
          fixedCount++;
        } else {
          console.log(`Summary unchanged for session ${session._id}`);
        }
        
        // Add a small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing session ${session._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nSummary fix completed:`);
    console.log(`- Total sessions processed: ${sessions.length}`);
    console.log(`- Sessions fixed: ${fixedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in fixSessionSummaries:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  fixSessionSummaries();
}

module.exports = { fixSessionSummaries };
