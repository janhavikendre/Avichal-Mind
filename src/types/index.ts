// User types
export interface User {
  _id: string;
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

// Session types
export interface Session {
  _id: string;
  userId: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi';
  startedAt: Date;
  completedAt?: Date;
  summary?: string;
  safetyFlags: {
    crisis: boolean;
    pii: boolean;
  };
  messageCount: number;
  totalDuration?: number;
  user?: User;
}

// Message types
export interface Message {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  contentText: string;
  contentAudioUrl?: string;
  tokensIn?: number;
  tokensOut?: number;
  createdAt: Date;
  audioDuration?: number;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Session creation types
export interface CreateSessionRequest {
  mode: 'text' | 'voice';
  language?: 'en' | 'hi';
}

export interface CreateSessionResponse {
  id: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi';
  startedAt: Date;
}

// Message types
export interface SendMessageRequest {
  content: string;
  isAudio?: boolean;
  audioUrl?: string;
}

export interface SendMessageResponse {
  message: {
    id: string;
    role: 'assistant';
    content: string;
    audioUrl?: string;
    createdAt: Date;
  };
}

// Crisis detection types
export interface CrisisResponse {
  error: 'crisis_detected';
  message: string;
  crisisResources: {
    helpline: string;
    website: string;
    emergency: string;
  };
}

// Audio processing types
export interface AudioProcessingRequest {
  audioBlob: Blob;
  sessionId: string;
}

export interface AudioProcessingResponse {
  text: string;
  audioUrl?: string;
  processingTime: number;
}

// User preferences types
export interface UpdatePreferencesRequest {
  language?: 'en' | 'hi';
  voiceEnabled?: boolean;
  notifications?: boolean;
}

// Analytics types
export interface SessionAnalytics {
  totalSessions: number;
  totalMessages: number;
  averageSessionDuration: number;
  mostUsedLanguage: 'en' | 'hi';
  crisisFlagsCount: number;
  monthlyTrends: {
    month: string;
    sessions: number;
    messages: number;
  }[];
}
