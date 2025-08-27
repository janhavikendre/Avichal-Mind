import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  startedAt: Date;
  completedAt?: Date;
  summary?: string;
  safetyFlags: {
    crisis: boolean;
    pii: boolean;
  };
  messageCount: number;
  totalDuration?: number; // in seconds
}

const sessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
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
    enum: ['en', 'hi', 'mr'],
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

// Indexes for faster queries
sessionSchema.index({ userId: 1, startedAt: -1 });
sessionSchema.index({ startedAt: -1 });
sessionSchema.index({ 'safetyFlags.crisis': 1 });

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  if (!this.completedAt || !this.startedAt) return null;
  return Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
});

export const Session = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);
