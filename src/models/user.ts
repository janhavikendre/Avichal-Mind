import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkUserId?: string;
  email?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  userType: 'clerk' | 'phone';
  createdAt: Date;
  updatedAt: Date;
  // Gamification fields
  points: number;
  level: number;
  streak: {
    current: number;
    longest: number;
    lastSessionDate?: Date;
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
    totalMinutes: number;
    crisisSessions: number;
    firstSessionDate?: Date;
    lastSessionDate?: Date;
    languagesUsed: string[];
    modesUsed: string[];
  };
}

const userSchema = new Schema<IUser>({
  clerkUserId: { type: String, sparse: true, unique: true },
  email: { type: String, sparse: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  phoneNumber: { type: String, sparse: true, unique: true },
  userType: { type: String, enum: ['clerk', 'phone'], required: true },
  // Gamification fields
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastSessionDate: { type: Date }
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
    totalMinutes: { type: Number, default: 0 },
    crisisSessions: { type: Number, default: 0 },
    firstSessionDate: { type: Date },
    lastSessionDate: { type: Date }
  }
}, {
  timestamps: true
});

// Custom validation for user types
userSchema.pre('validate', function(next) {
  if (this.userType === 'clerk') {
    if (!this.clerkUserId) {
      return next(new Error('clerkUserId is required for clerk users'));
    }
    if (!this.email) {
      return next(new Error('email is required for clerk users'));
    }
  } else if (this.userType === 'phone') {
    if (!this.phoneNumber) {
      return next(new Error('phoneNumber is required for phone users'));
    }
  }
  next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
