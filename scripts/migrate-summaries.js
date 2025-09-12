const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define schemas
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

const SummarySchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, maxlength: 2000 },
  language: { type: String, enum: ['en', 'hi', 'mr'], required: true },
  version: { type: Number, default: 1 },
  generatedAt: { type: Date, default: Date.now },
  summaryType: { type: String, enum: ['comprehensive', 'brief', 'key_insights'], default: 'comprehensive' },
  metadata: {
    messageCount: { type: Number, required: true },
    sessionDuration: { type: Number },
    mainTopics: [{ type: String }],
    emotionalState: { type: String },
    actionItems: [{ type: String }]
  },
  quality: {
    score: { type: Number, min: 1, max: 10, default: 5 },
    isValid: { type: Boolean, default: true },
    languageMatches: { type: Boolean, default: true }
  }
}, { timestamps: true });

const Session = mongoose.model('Session', SessionSchema);
const Message = mongoose.model('Message', MessageSchema);
const Summary = mongoose.model('Summary', SummarySchema);

// Summary generation functions
function detectSessionLanguage(messages) {
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  let hindiCount = 0;
  let marathiCount = 0;
  let englishCount = 0;
  
  for (const message of userMessages) {
    const content = message.contentText;
    
    // Count Devanagari characters
    const devanagariChars = (content.match(/[\u0900-\u097F]/g) || []).length;
    
    if (devanagariChars > 3) {
      // Check for Marathi-specific words
      const marathiWords = [
        'काय', 'कसे', 'कधी', 'कुठे', 'कोण', 'मी', 'तू', 'तो', 'ती', 'ते',
        'आहात', 'आहे', 'आहेत', 'मला', 'तुला', 'त्याला', 'तिला', 'त्यांना'
      ];
      
      // Check for Hindi-specific words
      const hindiWords = [
        'क्या', 'कैसे', 'कब', 'कहाँ', 'कौन', 'मैं', 'तू', 'वह', 'वो',
        'हैं', 'है', 'मुझे', 'तुझे', 'उसे', 'उन्हें'
      ];
      
      const marathiWordCount = marathiWords.filter(word => content.includes(word)).length;
      const hindiWordCount = hindiWords.filter(word => content.includes(word)).length;
      
      if (marathiWordCount > hindiWordCount) {
        marathiCount += marathiWordCount;
      } else {
        hindiCount += hindiWordCount;
      }
    }
    
    // Count English characters
    const englishChars = (content.match(/[a-zA-Z]/g) || []).length;
    englishCount += englishChars;
  }
  
  console.log(`Language detection - Hindi: ${hindiCount}, Marathi: ${marathiCount}, English: ${englishCount}`);
  
  if (marathiCount > hindiCount && marathiCount > 0) {
    return 'mr';
  } else if (hindiCount > 0) {
    return 'hi';
  } else if (englishCount > 10) {
    return 'en';
  }
  
  return 'en'; // Default to English
}

function extractMainTopics(userMessages) {
  const topicKeywords = {
    'stress_management': ['stress', 'anxiety', 'worried', 'overwhelmed', 'tension', 'तनाव', 'चिंता', 'ताणतणाव'],
    'sleep_issues': ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'नींद', 'झोप', 'थकान'],
    'work_pressure': ['work', 'job', 'career', 'boss', 'colleague', 'deadline', 'काम', 'नौकरी', 'कामकाज'],
    'relationship_problems': ['relationship', 'partner', 'family', 'friend', 'marriage', 'रिश्ता', 'पारिवारिक', 'नातेसंबंध'],
    'self_care': ['self care', 'wellness', 'health', 'care', 'healing', 'स्वास्थ्य', 'देखभाल', 'आरोग्य'],
    'mindfulness': ['mindfulness', 'meditation', 'breathing', 'calm', 'peace', 'ध्यान', 'शांति', 'शांतता'],
    'confidence_issues': ['confidence', 'self-esteem', 'worth', 'believe', 'capable', 'आत्मविश्वास', 'भरवसा']
  };

  const topics = [];
  const allContent = userMessages.map(m => m.contentText.toLowerCase()).join(' ');

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => allContent.includes(keyword.toLowerCase()))) {
      topics.push(topic.replace('_', ' '));
    }
  }

  return topics.length > 0 ? topics : ['general wellness'];
}

function detectEmotionalState(userMessages) {
  const emotionKeywords = {
    'distressed': ['sad', 'depressed', 'crying', 'hopeless', 'उदास', 'दुखी', 'हताश'],
    'anxious': ['nervous', 'worried', 'scared', 'panic', 'चिंतित', 'घबराहट', 'भयभीत'],
    'frustrated': ['angry', 'irritated', 'annoyed', 'mad', 'गुस्सा', 'चिढ़', 'नाराज'],
    'hopeful': ['better', 'improving', 'positive', 'good', 'बेहतर', 'सुधार', 'अच्छा'],
    'calm': ['peaceful', 'relaxed', 'calm', 'serene', 'शांत', 'आराम', 'प्रशांत']
  };

  const allContent = userMessages.map(m => m.contentText.toLowerCase()).join(' ');

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(keyword => allContent.includes(keyword.toLowerCase()))) {
      return emotion;
    }
  }

  return 'neutral';
}

function extractActionItems(assistantMessages) {
  const actionIndicators = [
    'try', 'practice', 'consider', 'suggest', 'recommend', 'you could', 'you might',
    'कोशिश', 'अभ्यास', 'प्रयास', 'सुझाव', 'करने की कोशिश', 'प्रयत्न'
  ];

  const actionItems = [];
  const allContent = assistantMessages.map(m => m.contentText).join(' ');

  const sentences = allContent.split(/[.!?।]/);
  
  for (const sentence of sentences) {
    if (actionIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator.toLowerCase())
    )) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 100) {
        actionItems.push(trimmed);
      }
    }
  }

  return actionItems.slice(0, 3);
}

function generateFallbackSummary(messages, language, metadata) {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  const topics = metadata.mainTopics.join(', ');
  const emotionalState = metadata.emotionalState || 'neutral';
  
  if (language === 'hi') {
    return `यह सत्र ${topics} के विषय पर केंद्रित था। उपयोगकर्ता की भावनात्मक स्थिति ${emotionalState} थी। ${assistantMessages.length} सहायक सुझाव प्रदान किए गए जो ${userMessages.length} चर्चा के बिंदुओं को संबोधित करते थे।`;
  } else if (language === 'mr') {
    return `हे सत्र ${topics} या विषयावर केंद्रित होते. वापरकर्त्याची भावनिक स्थिती ${emotionalState} होती. ${assistantMessages.length} सहाय्यक सूचना दिल्या ज्या ${userMessages.length} चर्चेच्या मुद्द्यांना संबोधित करत होत्या.`;
  } else {
    return `This session focused on ${topics}. The user's emotional state was ${emotionalState}. ${assistantMessages.length} supportive suggestions were provided addressing ${userMessages.length} discussion points.`;
  }
}

function assessSummaryQuality(content, expectedLanguage, metadata) {
  let score = 5;
  let isValid = true;
  let languageMatches = true;

  // Check content length
  if (content.length < 50) {
    score -= 2;
    isValid = false;
  } else if (content.length > 100) {
    score += 1;
  }

  // Check language
  if (expectedLanguage === 'en') {
    const hasEnglish = /[a-zA-Z]/.test(content);
    const hasDevanagari = /[\u0900-\u097F]/.test(content);
    if (!hasEnglish || hasDevanagari) {
      languageMatches = false;
      score -= 2;
    }
  } else {
    const hasDevanagari = /[\u0900-\u097F]/.test(content);
    if (!hasDevanagari) {
      languageMatches = false;
      score -= 2;
    }
  }

  // Bonus for rich metadata
  if (metadata.mainTopics.length > 1) score += 1;
  if (metadata.actionItems && metadata.actionItems.length > 0) score += 1;
  if (metadata.emotionalState && metadata.emotionalState !== 'neutral') score += 1;

  return {
    score: Math.max(1, Math.min(10, score)),
    isValid,
    languageMatches
  };
}

function shouldSkipSession(messages) {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');

  // Skip if insufficient messages
  if (userMessages.length < 2 || assistantMessages.length < 1) {
    return true;
  }

  // Check if meaningful content exists
  const meaningfulUserMessages = userMessages.filter(msg => {
    const content = msg.contentText.trim();
    if (content.length < 10) return false;
    
    // Check if it's just a greeting
    const greetings = [
      'hi', 'hello', 'hey', 'namaste', 'namaskar',
      'हाय', 'हैलो', 'नमस्ते', 'नमस्कार',
      'हाय', 'हॅलो', 'नमस्कार'
    ];
    
    const lowerContent = content.toLowerCase();
    const isJustGreeting = greetings.some(greeting => 
      lowerContent === greeting || 
      lowerContent.startsWith(greeting + ' ') ||
      lowerContent.endsWith(' ' + greeting)
    ) && content.length < 50;
    
    return !isJustGreeting;
  });

  // Skip if no meaningful user messages
  if (meaningfulUserMessages.length < 2) {
    return true;
  }

  // Check if real problems discussed
  const problemIndicators = [
    'problem', 'issue', 'stress', 'anxiety', 'worried', 'sad', 'help',
    'समस्या', 'परेशानी', 'चिंता', 'दुख', 'मदद',
    'समस्या', 'अडचण', 'चिंता', 'दुःख', 'मदत'
  ];

  const hasRealProblems = meaningfulUserMessages.some(msg => {
    const content = msg.contentText.toLowerCase();
    return problemIndicators.some(indicator => 
      content.includes(indicator.toLowerCase())
    ) || content.length > 30;
  });

  return !hasRealProblems;
}

async function migrateSummaries() {
  try {
    await connectDB();
    
    console.log('Starting summary migration for existing sessions...');
    
    // Get all sessions that don't have summaries yet (including incomplete sessions with messages)
    const sessions = await Session.find({ 
      $or: [
        { summary: { $exists: false } },
        { summary: null },
        { summary: '' }
      ]
    }).sort({ startedAt: -1 });
    
    console.log(`Found ${sessions.length} sessions without summaries`);
    
    let generatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const session of sessions) {
      try {
        console.log(`Processing session ${session._id} (${session.language})`);
        
        // Check if summary already exists in new schema
        const existingSummary = await Summary.findOne({ sessionId: session._id });
        if (existingSummary) {
          console.log(`Summary already exists for session ${session._id}, skipping`);
          continue;
        }
        
        // Get messages for this session
        const messages = await Message.find({ sessionId: session._id })
          .sort({ createdAt: 1 });
        
        if (messages.length === 0) {
          console.log(`No messages found for session ${session._id}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Check if session should be skipped
        if (shouldSkipSession(messages)) {
          console.log(`Session ${session._id} skipped - insufficient meaningful content`);
          skippedCount++;
          continue;
        }
        
        // Detect actual session language
        const actualLanguage = detectSessionLanguage(messages);
        
        const userMessages = messages.filter(msg => msg.role === 'user');
        const assistantMessages = messages.filter(msg => msg.role === 'assistant');
        
        // Extract metadata
        const metadata = {
          messageCount: messages.length,
          sessionDuration: session.totalDuration,
          mainTopics: extractMainTopics(userMessages),
          emotionalState: detectEmotionalState(userMessages),
          actionItems: extractActionItems(assistantMessages)
        };
        
        // Generate summary content
        const summaryContent = generateFallbackSummary(messages, actualLanguage, metadata);
        
        // Assess quality
        const quality = assessSummaryQuality(summaryContent, actualLanguage, metadata);
        
        // Create new summary
        const summary = await Summary.create({
          sessionId: session._id,
          userId: session.userId,
          content: summaryContent,
          language: actualLanguage,
          version: 1,
          summaryType: 'comprehensive',
          metadata,
          quality
        });
        
        // Update session with summary for backward compatibility
        session.summary = summaryContent;
        await session.save();
        
        console.log(`Generated summary for session ${session._id}:`, {
          language: actualLanguage,
          topics: metadata.mainTopics.length,
          qualityScore: quality.score,
          summaryLength: summaryContent.length
        });
        
        generatedCount++;
        
        // Add a small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing session ${session._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nSummary migration completed:`);
    console.log(`- Total sessions processed: ${sessions.length}`);
    console.log(`- Summaries generated: ${generatedCount}`);
    console.log(`- Sessions skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error in summary migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateSummaries();
}

module.exports = { migrateSummaries };
