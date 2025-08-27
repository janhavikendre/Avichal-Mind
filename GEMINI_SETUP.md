# Gemini API Setup Instructions

## How to Get Your Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Choose "Create API Key in new project" or select existing project
   - Copy the generated API key

3. **Add to Environment Variables**
   - Open your `.env.local` file
   - Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyC...your_actual_key_here
   ```

4. **Restart Your Development Server**
   ```bash
   npm run dev
   ```

## Features Enabled with Gemini

✅ **Intelligent Responses**: Context-aware, culturally sensitive responses
✅ **Crisis Detection**: Automatic detection of crisis content
✅ **Multi-language Support**: Hindi, Marathi, and English responses
✅ **Safety Filters**: Built-in content safety measures
✅ **Fallback System**: Graceful fallback if API is unavailable

## Testing the Integration

1. Start a new session
2. Type a message like "I'm feeling stressed today"
3. You should receive an intelligent, empathetic response from Gemini
4. Try Hindi messages for Hindi responses
5. Try Marathi messages for Marathi responses

## Troubleshooting

- **API Key Error**: Make sure your API key is correct and has proper permissions
- **Rate Limits**: Gemini has rate limits, but they're generous for normal usage
- **Fallback Mode**: If Gemini is unavailable, the system will use pre-written responses

## Cost Information

- Gemini API is currently free for most usage
- Check Google AI Studio for current pricing and limits
- The app is configured to use minimal tokens for cost efficiency
