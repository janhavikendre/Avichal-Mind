import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  // Gamification fields
  points: number;
  level: number;
  streak: {
    current: number;
    longest: number;
    lastSessionDate: Date;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    category: 'consistency' | 'milestone' | 'special' | 'language' | 'mode';
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
    completedAt?: Date;
    category: 'sessions' | 'messages' | 'streak' | 'languages' | 'modes';
  }>;
  stats: {
    totalSessions: number;
    totalMessages: number;
    totalDuration: number;
    languagesUsed: string[];
    modesUsed: string[];
    firstSessionDate?: Date;
    lastSessionDate?: Date;
  };
}

const userSchema = new Schema<IUser>({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  // Gamification fields
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastSessionDate: { type: Date, default: null }
  },
  badges: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    category: { 
      type: String, 
      enum: ['consistency', 'milestone', 'special', 'language', 'mode'],
      required: true 
    }
  }],
  achievements: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    progress: { type: Number, default: 0 },
    target: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    category: { 
      type: String, 
      enum: ['sessions', 'messages', 'streak', 'languages', 'modes'],
      required: true 
    }
  }],
  stats: {
    totalSessions: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    languagesUsed: [{ type: String }],
    modesUsed: [{ type: String }],
    firstSessionDate: { type: Date },
    lastSessionDate: { type: Date }
  }
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
