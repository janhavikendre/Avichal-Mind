import { Summary, ISummary } from '@/models/summary';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { AIService } from './ai';
import mongoose from 'mongoose';

export interface SummaryGenerationResult {
  success: boolean;
  summary?: ISummary;
  message: string;
  skipped?: boolean;
}

export interface SummaryMetadata {
  messageCount: number;
  sessionDuration?: number;
  mainTopics: string[];
  emotionalState?: string;
  actionItems?: string[];
}

export class SummaryService {
  
  /**
   * Generate and save a comprehensive summary for a session
   */
  static async generateSessionSummary(sessionId: string, force: boolean = false): Promise<SummaryGenerationResult> {
    try {
      // Find the session
      const session = await Session.findById(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Get all messages for the session
      const messages = await Message.find({ sessionId })
        .sort({ createdAt: 1 })
        .lean();

      if (messages.length === 0) {
        return {
          success: false,
          message: 'No messages found for session'
        };
      }

      // Convert messages to AI service format
      const conversationHistory = messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.contentText
      }));

      // Generate summary using AI service
      const summaryContent = await AIService.generateSessionSummary(
        conversationHistory,
        session.language,
        force
      );

      // If summary is empty, it means the session doesn't warrant a summary
      if (!summaryContent || summaryContent.trim() === '') {
        console.log(`Session ${sessionId} skipped - insufficient meaningful content`);
        return {
          success: true,
          skipped: true,
          message: 'Session skipped - insufficient meaningful interaction'
        };
      }

      // Extract metadata from the conversation
      const metadata = this.extractSummaryMetadata(conversationHistory, session);

      // Calculate quality score
      const quality = this.assessSummaryQuality(summaryContent, session.language, metadata);

      // Check if summary already exists for this session
      const existingSummary = await Summary.findOne({ sessionId });
      
      let summary: ISummary;
      if (existingSummary) {
        // Update existing summary with new version
        existingSummary.content = summaryContent;
        existingSummary.language = session.language;
        existingSummary.version += 1;
        existingSummary.metadata = metadata;
        existingSummary.quality = quality;
        existingSummary.generatedAt = new Date();
        summary = await existingSummary.save();
        console.log(`Updated summary for session ${sessionId} (version ${summary.version})`);
      } else {
        // Create new summary - Fixed: Ensure userId is properly set
        summary = await Summary.create({
          sessionId: session._id,
          userId: session.userId, // This should match the user ID used in summaries API
          content: summaryContent,
          language: session.language,
          version: 1,
          summaryType: 'comprehensive',
          metadata,
          quality
        });
        console.log(`Created new summary for session ${sessionId} with userId: ${session.userId}`);
      }

      // Update session with summary reference (keeping backward compatibility)
      session.summary = summaryContent;
      await session.save();

      return {
        success: true,
        summary,
        message: 'Summary generated successfully'
      };

    } catch (error) {
      console.error('Error generating session summary:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get summary for a session
   */
  static async getSessionSummary(sessionId: string): Promise<ISummary | null> {
    try {
      return await Summary.findOne({ sessionId })
        .sort({ version: -1 }) // Get latest version
        .lean() as unknown as ISummary | null;
    } catch (error) {
      console.error('Error fetching session summary:', error);
      return null;
    }
  }

  /**
   * Get all summaries for a user
   */
  static async getUserSummaries(
    userId: string, 
    options: {
      language?: 'en' | 'hi' | 'mr';
      limit?: number;
      skip?: number;
      sortBy?: 'generatedAt' | 'version';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<ISummary[]> {
    try {
      const {
        language,
        limit = 50,
        skip = 0,
        sortBy = 'generatedAt',
        sortOrder = 'desc'
      } = options;

      const query: any = { userId };
      if (language) {
        query.language = language;
      }

      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      return await Summary.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .populate('sessionId', 'startedAt completedAt mode messageCount')
        .lean() as unknown as ISummary[];
    } catch (error) {
      console.error('Error fetching user summaries:', error);
      return [];
    }
  }

  /**
   * Extract metadata from conversation
   */
  private static extractSummaryMetadata(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    session: any
  ): SummaryMetadata {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');

    // Extract main topics
    const mainTopics = this.extractMainTopics(userMessages);

    // Detect emotional state
    const emotionalState = this.detectEmotionalState(userMessages);

    // Extract action items from assistant messages
    const actionItems = this.extractActionItems(assistantMessages);

    return {
      messageCount: messages.length,
      sessionDuration: session.totalDuration,
      mainTopics,
      emotionalState,
      actionItems
    };
  }

  /**
   * Extract main topics from user messages
   */
  private static extractMainTopics(userMessages: Array<{ content: string }>): string[] {
    const topicKeywords = {
      'stress_management': ['stress', 'anxiety', 'worried', 'overwhelmed', 'tension', 'तनाव', 'चिंता', 'ताणतणाव'],
      'sleep_issues': ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'नींद', 'झोप', 'थकान'],
      'work_pressure': ['work', 'job', 'career', 'boss', 'colleague', 'deadline', 'काम', 'नौकरी', 'कामकाज'],
      'relationship_problems': ['relationship', 'partner', 'family', 'friend', 'marriage', 'रिश्ता', 'पारिवारिक', 'नातेसंबंध'],
      'self_care': ['self care', 'wellness', 'health', 'care', 'healing', 'स्वास्थ्य', 'देखभाल', 'आरोग्य'],
      'mindfulness': ['mindfulness', 'meditation', 'breathing', 'calm', 'peace', 'ध्यान', 'शांति', 'शांतता'],
      'confidence_issues': ['confidence', 'self-esteem', 'worth', 'believe', 'capable', 'आत्मविश्वास', 'भरवसा']
    };

    const topics: string[] = [];
    const allContent = userMessages.map(m => m.content.toLowerCase()).join(' ');

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => allContent.includes(keyword.toLowerCase()))) {
        topics.push(topic.replace('_', ' '));
      }
    }

    return topics.length > 0 ? topics : ['general wellness'];
  }

  /**
   * Detect emotional state from user messages
   */
  private static detectEmotionalState(userMessages: Array<{ content: string }>): string {
    const emotionKeywords = {
      'distressed': ['sad', 'depressed', 'crying', 'hopeless', 'उदास', 'दुखी', 'हताश'],
      'anxious': ['nervous', 'worried', 'scared', 'panic', 'चिंतित', 'घबराहट', 'भयभीत'],
      'frustrated': ['angry', 'irritated', 'annoyed', 'mad', 'गुस्सा', 'चिढ़', 'नाराज'],
      'hopeful': ['better', 'improving', 'positive', 'good', 'बेहतर', 'सुधार', 'अच्छा'],
      'calm': ['peaceful', 'relaxed', 'calm', 'serene', 'शांत', 'आराम', 'प्रशांत']
    };

    const allContent = userMessages.map(m => m.content.toLowerCase()).join(' ');

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => allContent.includes(keyword.toLowerCase()))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * Extract action items from assistant messages
   */
  private static extractActionItems(assistantMessages: Array<{ content: string }>): string[] {
    const actionIndicators = [
      'try', 'practice', 'consider', 'suggest', 'recommend', 'you could', 'you might',
      'कोशिश', 'अभ्यास', 'प्रयास', 'सुझाव', 'करने की कोशिश', 'प्रयत्न'
    ];

    const actionItems: string[] = [];
    const allContent = assistantMessages.map(m => m.content).join(' ');

    // Simple extraction - look for sentences with action indicators
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

    return actionItems.slice(0, 3); // Return top 3 action items
  }

  /**
   * Assess summary quality
   */
  private static assessSummaryQuality(
    content: string, 
    expectedLanguage: 'en' | 'hi' | 'mr',
    metadata: SummaryMetadata
  ): { score: number; isValid: boolean; languageMatches: boolean } {
    let score = 5; // Base score
    let isValid = true;
    let languageMatches = true;

    // Check content length
    if (content.length < 50) {
      score -= 2;
      isValid = false;
    } else if (content.length > 100) {
      score += 1;
    }

    // Check if language matches expected
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

    // Check if content seems meaningful (not generic)
    const genericPhrases = [
      'session covered', 'topics discussed', 'supportive responses',
      'सत्र में चर्चा', 'विषयों पर बात', 'सहायक प्रतिक्रिया'
    ];
    
    if (genericPhrases.some(phrase => content.toLowerCase().includes(phrase.toLowerCase()))) {
      score -= 1;
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

  /**
   * Regenerate summary for a session
   */
  static async regenerateSessionSummary(sessionId: string, options: {
    summaryType?: 'comprehensive' | 'brief' | 'key_insights';
  } = {}): Promise<SummaryGenerationResult> {
    console.log(`Regenerating summary for session ${sessionId}`);
    return this.generateSessionSummary(sessionId);
  }

  /**
   * Delete summary for a session
   */
  static async deleteSessionSummary(sessionId: string): Promise<boolean> {
    try {
      await Summary.deleteMany({ sessionId });
      
      // Also clear summary from session model for backward compatibility
      const session = await Session.findById(sessionId);
      if (session) {
        session.summary = undefined;
        await session.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting session summary:', error);
      return false;
    }
  }

  /**
   * Get summary statistics for a user
   */
  static async getUserSummaryStats(userId: string): Promise<{
    totalSummaries: number;
    summariesByLanguage: Record<string, number>;
    averageQualityScore: number;
    topicsDistribution: Record<string, number>;
  }> {
    try {
      const summaries = await Summary.find({ userId }).lean();
      
      const stats = {
        totalSummaries: summaries.length,
        summariesByLanguage: {} as Record<string, number>,
        averageQualityScore: 0,
        topicsDistribution: {} as Record<string, number>
      };

      // Calculate language distribution
      summaries.forEach(summary => {
        stats.summariesByLanguage[summary.language] = 
          (stats.summariesByLanguage[summary.language] || 0) + 1;
      });

      // Calculate average quality score
      if (summaries.length > 0) {
        const totalScore = summaries.reduce((sum, s) => sum + s.quality.score, 0);
        stats.averageQualityScore = totalScore / summaries.length;
      }

      // Calculate topics distribution
      summaries.forEach(summary => {
        summary.metadata.mainTopics.forEach((topic: string) => {
          stats.topicsDistribution[topic] = 
            (stats.topicsDistribution[topic] || 0) + 1;
        });
      });

      return stats;
    } catch (error) {
      console.error('Error calculating summary stats:', error);
      return {
        totalSummaries: 0,
        summariesByLanguage: {},
        averageQualityScore: 0,
        topicsDistribution: {}
      };
    }
  }
}
