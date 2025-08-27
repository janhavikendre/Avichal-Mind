const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly in the seed script
const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    voiceEnabled: {
      type: Boolean,
      default: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mode: {
    type: String,
    enum: ['text', 'voice'],
    required: true,
  },
  language: {
    type: String,
    enum: ['en', 'hi'],
    required: true,
    default: 'en',
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  summary: {
    type: String,
    maxlength: 1000,
  },
  safetyFlags: {
    crisis: {
      type: Boolean,
      default: false,
    },
    pii: {
      type: Boolean,
      default: false,
    },
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number,
    min: 0,
  },
}, {
  timestamps: true,
});

const messageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  contentText: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  contentAudioUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('https://');
      },
      message: 'Audio URL must be a valid HTTPS URL',
    },
  },
  tokensIn: {
    type: Number,
    min: 0,
  },
  tokensOut: {
    type: Number,
    min: 0,
  },
  audioDuration: {
    type: Number,
    min: 0,
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Session.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = [
      {
        clerkUserId: 'user_2sample1',
        email: 'priya@example.com',
        name: 'Priya Sharma',
        preferences: {
          language: 'en',
          voiceEnabled: true,
          notifications: true,
        },
      },
      {
        clerkUserId: 'user_2sample2',
        email: 'raj@example.com',
        name: 'Raj Patel',
        preferences: {
          language: 'hi',
          voiceEnabled: false,
          notifications: true,
        },
      },
      {
        clerkUserId: 'user_2sample3',
        email: 'meera@example.com',
        name: 'Meera Singh',
        preferences: {
          language: 'en',
          voiceEnabled: true,
          notifications: false,
        },
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created sample users');

    // Create sample sessions
    const sessions = [
      {
        userId: createdUsers[0]._id,
        mode: 'text',
        language: 'en',
        startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        summary: 'Discussed work stress and family pressure. Explored breathing exercises and time management strategies.',
        safetyFlags: { crisis: false, pii: false },
        messageCount: 6,
        totalDuration: 1800, // 30 minutes
      },
      {
        userId: createdUsers[1]._id,
        mode: 'voice',
        language: 'hi',
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 2 days ago + 45 minutes
        summary: 'बातचीत में परिवार के साथ संबंधों और भावनात्मक समर्थन पर चर्चा हुई।',
        safetyFlags: { crisis: false, pii: true },
        messageCount: 8,
        totalDuration: 2700, // 45 minutes
      },
      {
        userId: createdUsers[2]._id,
        mode: 'text',
        language: 'en',
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        // Not completed yet
        safetyFlags: { crisis: false, pii: false },
        messageCount: 4,
      },
    ];

    const createdSessions = await Session.insertMany(sessions);
    console.log('Created sample sessions');

    // Create sample messages
    const messages = [
      // Session 1 messages
      {
        sessionId: createdSessions[0]._id,
        role: 'user',
        contentText: 'I\'m feeling really stressed about work lately. My boss keeps giving me more projects and I don\'t know how to manage everything.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        sessionId: createdSessions[0]._id,
        role: 'assistant',
        contentText: 'I hear you, and work stress can be really overwhelming. Let\'s take a moment to breathe together - inhale for 4 counts, hold for 4, exhale for 6. This simple practice can help ground you in the present moment.',
        tokensIn: 25,
        tokensOut: 35,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 1000),
      },
      {
        sessionId: createdSessions[0]._id,
        role: 'user',
        contentText: 'Thank you. I also feel like my family expects so much from me. I\'m the eldest and everyone looks up to me.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 1000),
      },
      {
        sessionId: createdSessions[0]._id,
        role: 'assistant',
        contentText: 'Being the eldest comes with its own set of pressures, and it\'s completely normal to feel this way. Remember, you don\'t have to carry everything alone. Consider talking to someone you trust, or if these feelings persist, reaching out to a mental health professional could be very helpful.',
        tokensIn: 30,
        tokensOut: 45,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 90 * 1000),
      },

      // Session 2 messages (Hindi)
      {
        sessionId: createdSessions[1]._id,
        role: 'user',
        contentText: 'मैं अपने परिवार के साथ बहुत तनाव महसूस कर रहा हूं। मेरी मां हमेशा मुझसे बहुत उम्मीदें रखती हैं।',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        sessionId: createdSessions[1]._id,
        role: 'assistant',
        contentText: 'मैं आपकी बात सुन रहा हूं और लगता है कि आप एक कठिन समय से गुजर रहे हैं। चलिए एक साथ सांस लेते हैं - 4 गिनती तक सांस अंदर लें, 4 तक रोकें, 6 तक छोड़ें। यह सरल अभ्यास आपको वर्तमान क्षण में जमीन पर लाने में मदद कर सकता है।',
        tokensIn: 20,
        tokensOut: 40,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 1000),
      },

      // Session 3 messages (ongoing)
      {
        sessionId: createdSessions[2]._id,
        role: 'user',
        contentText: 'I\'ve been feeling lonely lately. I moved to a new city for work and don\'t know many people here.',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        sessionId: createdSessions[2]._id,
        role: 'assistant',
        contentText: 'Moving to a new place can be really challenging, and feeling lonely is completely normal. Remember, you don\'t have to face this alone. There are people who care and want to help. Would you like to explore some coping strategies together?',
        tokensIn: 25,
        tokensOut: 40,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 30 * 1000),
      },
    ];

    await Message.insertMany(messages);
    console.log('Created sample messages');

    console.log('Database seeded successfully!');
    console.log(`Created ${createdUsers.length} users, ${createdSessions.length} sessions, and ${messages.length} messages`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
