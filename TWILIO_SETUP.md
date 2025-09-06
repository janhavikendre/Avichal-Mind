# Twilio Voice Integration Setup Guide

This guide will help you set up Twilio voice calls for your AI wellness platform.

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **Twilio Phone Number**: Purchase a phone number from Twilio
3. **ngrok** (for local testing): Install with `npm install -g ngrok`

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Twilio Voice Integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Setup Steps

### 1. Get Twilio Credentials

1. Log into your [Twilio Console](https://console.twilio.com)
2. Copy your **Account SID** and **Auth Token** from the dashboard
3. Go to **Phone Numbers** → **Manage** → **Active numbers**
4. Copy your Twilio phone number (format: +1234567890)

### 2. Configure Webhook URL

For local development, you'll need to expose your local server using ngrok:

```bash
# Install ngrok globally
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`) and update your `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### 3. Configure Twilio Phone Number

1. Go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click on your Twilio phone number
3. Set the **Webhook URL** to: `https://your-ngrok-url.ngrok.io/api/voice-webhook`
4. Set **HTTP method** to `POST`
5. Save the configuration

### 4. Test the Integration

Run the test script to verify your configuration:

```bash
node scripts/test-twilio.js
```

## How It Works

### 1. User Flow

1. User visits the landing page (`/`)
2. User enters their phone number in the phone input field
3. User clicks "Get AI Wellness Call"
4. System creates a user account (if needed) and initiates a Twilio call
5. User receives a call from your Twilio number
6. AI assistant greets the user and listens for speech input
7. AI processes the speech and responds with synthesized voice

### 2. Technical Flow

```
User Input → /api/call → Twilio API → User's Phone
                ↓
User's Phone → Twilio → /api/voice-webhook → AI Processing → TwiML Response
```

### 3. API Endpoints

#### `/api/call` (POST)
- Accepts phone number
- Creates user account if needed
- Initiates Twilio outbound call
- Returns call SID and user ID

#### `/api/voice-webhook` (POST)
- Receives Twilio webhook data
- Processes speech input
- Generates AI response using Gemini
- Returns TwiML for voice synthesis

## Features

### Voice Capabilities
- **Speech Recognition**: Converts user speech to text
- **AI Processing**: Uses Gemini AI for intelligent responses
- **Voice Synthesis**: Converts AI responses to speech
- **Real-time Conversation**: Continuous speech recognition and response

### User Management
- **Automatic User Creation**: Creates users for phone-only access
- **Session Tracking**: Tracks voice call sessions
- **Message History**: Stores conversation history
- **Crisis Detection**: Detects and responds to crisis situations

### Security & Privacy
- **Phone Number Validation**: Validates phone number format
- **Rate Limiting**: Prevents abuse
- **Secure Webhooks**: Validates Twilio webhook signatures
- **Data Encryption**: All data encrypted in transit and at rest

## Testing

### Local Testing with ngrok

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Start ngrok in another terminal:
   ```bash
   ngrok http 3000
   ```

3. Update your Twilio webhook URL with the ngrok HTTPS URL

4. Test by entering a phone number on the landing page

### Production Deployment

1. Deploy your app to a hosting service (Vercel, Netlify, etc.)
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Update Twilio webhook URL to your production domain
4. Test with real phone numbers

## Troubleshooting

### Common Issues

1. **"Invalid phone number" error**
   - Ensure phone number is in E.164 format (+1234567890)
   - Check if the number is valid and can receive calls

2. **Webhook not receiving calls**
   - Verify ngrok is running and URL is correct
   - Check Twilio webhook configuration
   - Ensure webhook URL is HTTPS (required by Twilio)

3. **AI responses not working**
   - Check Gemini API key is set in environment variables
   - Verify database connection
   - Check console logs for errors

4. **Call not connecting**
   - Verify Twilio account has sufficient balance
   - Check if the phone number can receive calls
   - Ensure webhook URL is accessible

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed logs in the console.

## Cost Considerations

- **Twilio Calls**: ~$0.02-0.05 per minute
- **Speech Recognition**: ~$0.02 per minute
- **Voice Synthesis**: ~$0.02 per minute
- **Total**: ~$0.06-0.09 per minute of conversation

## Security Best Practices

1. **Validate Webhook Signatures**: Verify requests come from Twilio
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Phone Number Validation**: Validate phone numbers before making calls
4. **Error Handling**: Implement proper error handling and logging
5. **Data Privacy**: Follow GDPR/CCPA guidelines for user data

## Support

For issues with this integration:
1. Check the troubleshooting section above
2. Review Twilio documentation: [twilio.com/docs](https://www.twilio.com/docs)
3. Check your Twilio account logs in the console
4. Verify your environment variables are set correctly

## Next Steps

1. **Enhanced Voice Features**: Add support for multiple languages
2. **Call Recording**: Implement call recording for quality assurance
3. **Analytics**: Add call analytics and reporting
4. **SMS Integration**: Add SMS support for follow-up messages
5. **Advanced AI**: Integrate with more sophisticated AI models
