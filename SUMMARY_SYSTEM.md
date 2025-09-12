# Enhanced Summary System

This document describes the new and improved summary system for Avichal Mind mental wellness sessions.

## Overview

The enhanced summary system provides intelligent, language-aware, and comprehensive summaries for mental wellness sessions. It includes quality assessment, metadata extraction, and proper language detection.

## Key Features

### 1. Intelligent Session Filtering
- **Meaningful Content Detection**: Only generates summaries for sessions with substantial user interaction
- **Greeting Filter**: Skips sessions that only contain greetings without real conversation
- **Problem Discussion Detection**: Ensures summaries are only created when users discuss actual problems or concerns

### 2. Language-Aware Summaries
- **Automatic Language Detection**: Detects the actual conversation language from user messages
- **Native Language Summaries**: Generates summaries in the same language as the session (Hindi, Marathi, or English)
- **Language Validation**: Ensures generated summaries match the expected language

### 3. Rich Metadata Extraction
- **Topic Detection**: Automatically identifies main topics discussed (stress, work, relationships, etc.)
- **Emotional State Analysis**: Detects user's emotional state (anxious, calm, frustrated, etc.)
- **Action Items**: Extracts specific suggestions and recommendations provided by the assistant
- **Session Metrics**: Tracks message count, duration, and conversation quality

### 4. Quality Assessment
- **Quality Scoring**: Each summary receives a quality score (1-10) based on multiple factors
- **Validation Checks**: Ensures summaries are meaningful, properly formatted, and in correct language
- **Version Control**: Tracks summary versions when regenerated

## Database Schema

### Summary Model (`src/models/summary.ts`)

```typescript
interface ISummary {
  sessionId: ObjectId;          // Reference to session
  userId: ObjectId;             // Reference to user
  content: string;              // Summary content (max 2000 chars)
  language: 'en' | 'hi' | 'mr'; // Summary language
  version: number;              // Version number (increments on regeneration)
  generatedAt: Date;            // When summary was created
  summaryType: string;          // Type: comprehensive, brief, key_insights
  
  metadata: {
    messageCount: number;       // Number of messages in session
    sessionDuration: number;    // Session duration in seconds
    mainTopics: string[];       // Identified topics
    emotionalState: string;     // User's emotional state
    actionItems: string[];      // Extracted action items
  };
  
  quality: {
    score: number;              // Quality score 1-10
    isValid: boolean;           // Whether summary is valid
    languageMatches: boolean;   // Whether language detection succeeded
  };
}
```

## API Endpoints

### Summary Management

- `GET /api/summaries` - Fetch all summaries for authenticated user
- `GET /api/summaries/[id]` - Fetch specific session summary
- `POST /api/summaries/[id]` - Generate/regenerate summary for session
- `DELETE /api/summaries/[id]` - Delete summary for session

### Query Parameters for GET /api/summaries
- `language` - Filter by language (en, hi, mr)
- `limit` - Number of summaries to return (default: 50)
- `skip` - Number of summaries to skip for pagination
- `sortBy` - Sort field (generatedAt, version)
- `sortOrder` - Sort order (asc, desc)

## Summary Generation Logic

### When Summaries Are Created
1. **Session Finalization**: Automatically during session completion
2. **Manual Generation**: Via API call to generate endpoint
3. **Regeneration**: When user requests summary regeneration

### Filtering Criteria
Summaries are **NOT** generated for sessions that:
- Have fewer than 2 meaningful user messages
- Contain only greetings without substantial conversation
- Have no assistant responses
- Don't discuss actual problems or concerns

### Language Detection Process
1. **Devanagari Detection**: Counts Unicode Devanagari characters (Hindi/Marathi)
2. **Language-Specific Words**: Uses word lists to distinguish Hindi vs Marathi
3. **English Fallback**: Defaults to English for unclear cases

### Topic Extraction
Automatically identifies topics based on keyword matching:
- **Stress Management**: stress, anxiety, worry, tension
- **Sleep Issues**: sleep, insomnia, tired, exhausted
- **Work Pressure**: work, job, career, deadline
- **Relationships**: relationship, family, partner
- **Self Care**: wellness, health, healing
- **Mindfulness**: meditation, breathing, calm
- **Confidence**: self-esteem, worth, confidence

## Usage

### Migration Script
Run the migration script to generate summaries for existing sessions:

```bash
npm run migrate-summaries
```

### Frontend Integration
The new summaries page (`/summaries`) provides:
- **Statistics Dashboard**: Overview of summary metrics
- **Advanced Filters**: Filter by language, quality, topic
- **Quality Indicators**: Visual quality scores and language validation
- **Regeneration**: Option to regenerate summaries
- **Pagination**: Efficient browsing of large summary collections

### Programmatic Usage

```typescript
import { SummaryService } from '@/services/summary';

// Generate summary for a session
const result = await SummaryService.generateSessionSummary(sessionId);

// Get user's summaries with filters
const summaries = await SummaryService.getUserSummaries(userId, {
  language: 'hi',
  limit: 20,
  sortBy: 'generatedAt',
  sortOrder: 'desc'
});

// Get summary statistics
const stats = await SummaryService.getUserSummaryStats(userId);
```

## Quality Scoring

Summaries are scored based on:
- **Content Length**: Appropriate length (50-500 characters gets higher score)
- **Language Accuracy**: Correct language detection and usage
- **Metadata Richness**: More topics, emotional states, and action items
- **Specificity**: Non-generic content that reflects actual conversation

## Backward Compatibility

The system maintains backward compatibility:
- **Session Model**: Still includes `summary` field for existing code
- **Automatic Sync**: New summaries are also stored in session model
- **Gradual Migration**: Existing summaries are preserved during migration

## Configuration

### Environment Variables
- `OPENAI_API_KEY` - Required for AI-powered summary generation
- `MONGODB_URI` - Database connection string

### Fallback Behavior
When OpenAI API is unavailable:
- Uses rule-based summary generation
- Maintains language-appropriate templates
- Includes basic metadata extraction

## Monitoring and Analytics

### Logging
- Summary generation attempts
- Quality scores and validation results
- Language detection accuracy
- Performance metrics

### Quality Metrics
- Average quality scores per user/language
- Language detection accuracy rates
- Topic distribution analysis
- User engagement with summaries

## Future Enhancements

### Planned Features
1. **Summary Types**: Brief summaries, key insights, action-focused summaries
2. **Export Options**: PDF/Word export functionality
3. **Sharing**: Secure summary sharing with healthcare providers
4. **Analytics**: Trend analysis across sessions
5. **Personalization**: User-specific summary preferences

### Performance Optimizations
1. **Caching**: Summary caching for frequently accessed sessions
2. **Batch Processing**: Bulk summary generation
3. **Background Jobs**: Async summary generation
4. **Compression**: Content compression for large summaries

## Troubleshooting

### Common Issues

1. **Missing Summaries**: Check if session meets minimum criteria
2. **Wrong Language**: Verify language detection with session content
3. **Low Quality Scores**: Review message content and interaction depth
4. **API Errors**: Check OpenAI API key and rate limits

### Debug Commands

```bash
# Check summary generation for specific session
curl -X POST /api/summaries/[sessionId] \
  -H "Content-Type: application/json" \
  -d '{"action": "regenerate"}'

# Get summary statistics
curl /api/summaries?limit=1
```

## Support

For technical support or questions about the summary system:
1. Check the troubleshooting section above
2. Review API response messages for specific error details
3. Monitor application logs for detailed error information
4. Use the migration script to backfill missing summaries
