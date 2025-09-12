import mongoose, { Schema, Document } from 'mongoose';

export interface ISummary extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  language: 'en' | 'hi' | 'mr';
  version: number;
  generatedAt: Date;
  summaryType: 'comprehensive' | 'brief' | 'key_insights';
  metadata: {
    messageCount: number;
    sessionDuration?: number;
    mainTopics: string[];
    emotionalState?: string;
    actionItems?: string[];
  };
  quality: {
    score: number; // 1-10 rating
    isValid: boolean;
    languageMatches: boolean;
  };
}

const summarySchema = new Schema<ISummary>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  summaryType: {
    type: String,
    enum: ['comprehensive', 'brief', 'key_insights'],
    default: 'comprehensive',
  },
  metadata: {
    messageCount: {
      type: Number,
      required: true,
    },
    sessionDuration: {
      type: Number, // in seconds
    },
    mainTopics: [{
      type: String,
    }],
    emotionalState: {
      type: String,
    },
    actionItems: [{
      type: String,
    }],
  },
  quality: {
    score: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    languageMatches: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
summarySchema.index({ sessionId: 1, version: -1 });
summarySchema.index({ userId: 1, generatedAt: -1 });
summarySchema.index({ language: 1 });
summarySchema.index({ 'quality.isValid': 1 });

// Ensure only one summary per session (latest version)
summarySchema.index({ sessionId: 1 }, { unique: false });

export const Summary = mongoose.models.Summary || mongoose.model<ISummary>('Summary', summarySchema);
