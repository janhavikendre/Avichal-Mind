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
