import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  contentText: string;
  contentAudioUrl?: string;
  tokensIn?: number;
  tokensOut?: number;
  createdAt: Date;
  audioDuration?: number; // in seconds
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  videoSuggestions: {
    id: string;
    title: string;
    description?: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt?: string;
    duration?: string;
    viewCount?: string;
    url: string;
    embedUrl: string;
    relevance?: string;
    language?: string;
  }[];
}

const messageSchema = new Schema<IMessage>({
  sessionId: {
    type: Schema.Types.ObjectId,
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
      validator: function(v: string) {
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
  videoSuggestions: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String, required: true },
    channelTitle: { type: String, required: true },
    publishedAt: { type: String },
    duration: { type: String },
    viewCount: { type: String },
    url: { type: String, required: true },
    embedUrl: { type: String, required: true },
    relevance: { type: String, default: 'Based on your conversation' },
    language: { type: String, default: 'en' }
  }],
}, {
  timestamps: true,
});

// Indexes for faster queries
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ role: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for total tokens
messageSchema.virtual('totalTokens').get(function() {
  return (this.tokensIn || 0) + (this.tokensOut || 0);
});

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
