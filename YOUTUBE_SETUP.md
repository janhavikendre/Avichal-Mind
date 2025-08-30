# YouTube API Setup for Video Suggestions

This guide will help you set up YouTube API integration to enable video suggestions in your AI chat responses.

## Prerequisites

1. Google Cloud Console account
2. YouTube Data API v3 enabled

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project (required for API usage)

### 2. Enable YouTube Data API v3

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 3. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 4. Configure Environment Variables

1. Add the API key to your `.env.local` file:
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
```

2. Replace `your_youtube_api_key_here` with the actual API key you copied

### 5. Restrict API Key (Recommended)

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers"
4. Add your domain(s) to restrict usage
5. Under "API restrictions", select "Restrict key"
6. Select "YouTube Data API v3" from the dropdown

## Features

### Video Suggestions

- **Contextual Search**: Videos are suggested based on conversation topics
- **Multi-language Support**: Works with English, Hindi, and Marathi
- **Mental Wellness Focus**: Prioritizes mental health and wellness content
- **Embedded Display**: Videos appear directly in chat responses

### How It Works

1. **Topic Detection**: The system analyzes conversation context to identify relevant topics
2. **Enhanced Search**: Adds mental wellness keywords to improve search results
3. **Video Filtering**: Filters for medium-length, embeddable videos
4. **Rich Metadata**: Displays thumbnails, titles, channel names, and durations

### Supported Topics

- Anxiety and stress management
- Depression and mood support
- Relationship advice
- Work and career stress
- Sleep and relaxation
- Mindfulness and meditation

## API Quotas

- **Free Tier**: 10,000 units per day
- **Cost**: $5 per 1,000 units after free tier
- **Search Operation**: 100 units per request
- **Video Details**: 1 unit per request

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Ensure the API key is correctly added to `.env.local`
   - Check that YouTube Data API v3 is enabled
   - Verify billing is enabled on your Google Cloud project

2. **No Video Suggestions**
   - Check browser console for API errors
   - Verify API quotas haven't been exceeded
   - Ensure the conversation context is sufficient for topic detection

3. **Rate Limiting**
   - YouTube API has daily quotas
   - Consider implementing caching for repeated searches
   - Monitor usage in Google Cloud Console

### Error Messages

- `YouTube API key not configured`: Add `YOUTUBE_API_KEY` to environment variables
- `YouTube API error: 403`: Check API key restrictions and billing
- `YouTube API error: 429`: Daily quota exceeded

## Testing

1. Start a new chat session
2. Ask about mental health topics (anxiety, stress, etc.)
3. Check if video suggestions appear in AI responses
4. Click "Watch" buttons to verify video links work

## Security Notes

- Never commit API keys to version control
- Use environment variables for all API keys
- Restrict API keys to your domain
- Monitor API usage regularly
- Consider implementing rate limiting on your end

## Cost Optimization

- Implement caching for repeated searches
- Limit video suggestions to 3 per response
- Use topic detection to avoid unnecessary searches
- Monitor usage in Google Cloud Console
- Set up billing alerts
