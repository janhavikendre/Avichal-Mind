import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    language: 'en' | 'hi';
    voiceEnabled: boolean;
    notifications: boolean;
  };
}

const userSchema = new Schema<IUser>({
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

// Index for faster queries
userSchema.index({ createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
