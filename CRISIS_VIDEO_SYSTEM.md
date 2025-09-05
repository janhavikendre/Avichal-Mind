# Crisis Video Suggestion System

## Overview

The Crisis Video Suggestion System is a comprehensive mental health support feature that automatically detects when users are experiencing mental health crises or emotional distress and provides relevant, supportive videos to help them through difficult moments.

## Key Features

### 1. Enhanced Crisis Detection
- **Multi-level Detection**: Identifies suicidal ideation, mental breakdowns, panic attacks, and severe distress
- **Multi-language Support**: Works with English, Hindi, and Marathi
- **Contextual Analysis**: Considers conversation history for escalating distress patterns
- **Severity Assessment**: Categorizes crisis severity (low, medium, high, critical)

### 2. Specialized Crisis Video Service
- **Curated Content**: Pre-selected videos for different crisis types
- **Categorized Support**: Videos organized by crisis type (anxiety, depression, panic, grief, etc.)
- **Language-specific Content**: Videos and descriptions in user's preferred language
- **Priority System**: High-priority videos shown first for immediate support

### 3. Crisis Response Integration
- **Immediate Response**: AI generates crisis-specific responses with appropriate tone
- **Video Suggestions**: Automatically suggests relevant crisis support videos
- **Emergency Resources**: Provides crisis helpline numbers and emergency contacts
- **Fallback System**: Works even when YouTube API is unavailable

### 4. Crisis Support UI Component
- **Emergency Resources**: Prominent display of crisis helplines and emergency numbers
- **Video Gallery**: Easy-to-access crisis support videos with thumbnails
- **Multi-language Interface**: UI adapts to user's language preference
- **Mobile-friendly**: Responsive design for all devices

## Crisis Types Detected

### 1. Suicidal Ideation (Critical)
- Keywords: suicide, kill myself, want to die, end it all, self harm
- Response: Immediate crisis intervention with emergency resources
- Videos: Crisis support and suicide prevention content

### 2. Mental Breakdown (High)
- Keywords: mental breakdown, breaking down, falling apart, losing it
- Response: Compassionate support with grounding techniques
- Videos: Mental breakdown recovery and crisis intervention content

### 3. Panic Attack (High)
- Keywords: panic attack, can't breathe, hyperventilating, heart racing
- Response: Breathing exercises and calming techniques
- Videos: Panic attack management and breathing exercises

### 4. Severe Distress (Medium)
- Keywords: emergency, need help now, can't take it anymore, desperate
- Response: Supportive guidance with coping strategies
- Videos: Crisis coping strategies and grounding techniques

## Technical Implementation

### Files Created/Modified

1. **`src/services/ai.ts`**
   - Enhanced crisis detection with `detectMentalBreakdown()` method
   - Crisis-specific response generation
   - Multi-language crisis responses

2. **`src/lib/crisis-video-service.ts`**
   - Curated crisis video database
   - Crisis-specific video retrieval
   - Fallback system for API failures

3. **`src/components/ui/crisis-video-support.tsx`**
   - Crisis support UI component
   - Emergency resource display
   - Video gallery with thumbnails

4. **`src/components/chat-interface.tsx`**
   - Integration of crisis video support
   - Conditional rendering based on crisis type
   - Enhanced video suggestion display

5. **`src/app/api/session/[id]/message/route.ts`**
   - Crisis detection integration
   - Crisis video suggestion logic
   - Enhanced message processing

### Crisis Video Database Structure

```typescript
interface CrisisVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
  embedUrl: string;
  duration?: string;
  category: 'anxiety' | 'depression' | 'panic' | 'grief' | 'crisis_support' | 'breathing' | 'grounding' | 'mindfulness';
  language: 'en' | 'hi' | 'mr';
  priority: 'high' | 'medium' | 'low';
}
```

## Usage Flow

1. **User sends message** with crisis indicators
2. **Crisis detection** analyzes message and conversation history
3. **AI generates** crisis-specific response with appropriate tone
4. **Crisis video service** retrieves relevant support videos
5. **UI displays** crisis support component with videos and emergency resources
6. **User accesses** immediate support through videos and helplines

## Emergency Resources Provided

### English
- Crisis Helpline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency Services: 112

### Hindi
- संकट हेल्पलाइन: 988
- संकट टेक्स्ट लाइन: HOME को 741741 पर टेक्स्ट करें
- आपातकालीन सेवाएं: 112

### Marathi
- संकट हेल्पलाइन: 988
- संकट टेक्स्ट लाइन: HOME ला 741741 ला टेक्स्ट करा
- आणीबाणी सेवा: 112

## Safety Features

1. **Immediate Intervention**: Suicidal ideation triggers immediate crisis response
2. **Professional Resources**: Always directs users to professional help
3. **Emergency Contacts**: Prominent display of crisis helplines
4. **Fallback System**: Works even when external APIs fail
5. **Multi-language Support**: Ensures accessibility for all users

## Configuration

### Environment Variables
- `YOUTUBE_API_KEY`: Required for YouTube video suggestions
- `GEMINI_API_KEY`: Required for AI crisis detection and responses

### Crisis Detection Sensitivity
The system can be configured to adjust sensitivity levels:
- **High Sensitivity**: Detects more subtle distress indicators
- **Medium Sensitivity**: Balanced detection (default)
- **Low Sensitivity**: Only detects clear crisis indicators

## Testing

### Test Crisis Scenarios
1. **Suicidal Ideation**: "I want to end it all"
2. **Mental Breakdown**: "I'm having a mental breakdown"
3. **Panic Attack**: "I'm having a panic attack"
4. **Severe Distress**: "I can't take it anymore"

### Expected Behavior
- Crisis detection triggers appropriate response
- Crisis videos are suggested
- Emergency resources are displayed
- UI shows crisis support component

## Future Enhancements

1. **Real-time Crisis Monitoring**: Continuous monitoring of user state
2. **Personalized Crisis Plans**: User-specific crisis intervention plans
3. **Professional Integration**: Direct connection to mental health professionals
4. **Crisis History Tracking**: Monitoring of crisis patterns over time
5. **Advanced AI Detection**: Machine learning-based crisis detection

## Support and Maintenance

### Monitoring
- Track crisis detection accuracy
- Monitor video suggestion effectiveness
- Analyze user engagement with crisis resources

### Updates
- Regular updates to crisis video database
- Refinement of crisis detection algorithms
- Enhancement of emergency resource information

## Privacy and Ethics

- **User Privacy**: Crisis data is handled with utmost confidentiality
- **Professional Boundaries**: System provides support but encourages professional help
- **Cultural Sensitivity**: Respects cultural differences in mental health expression
- **Informed Consent**: Users are aware of crisis detection capabilities

## Conclusion

The Crisis Video Suggestion System provides a comprehensive, culturally-sensitive approach to mental health crisis support. By combining intelligent detection, curated content, and immediate resources, it offers users a lifeline during their most difficult moments while encouraging professional help and long-term recovery.
