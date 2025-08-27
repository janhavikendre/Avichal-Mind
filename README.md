# Avichal Mind - AI Mental Wellness for India

An AI-assisted mental wellness web application designed specifically for the Indian audience, providing private, self-serve guidance through voice and text conversations.

## 🚀 Features

- **Voice & Text Support**: Speak naturally or type your thoughts in Hindi or English
- **AI-Powered Guidance**: Compassionate responses tailored for Indian cultural context
- **Complete Privacy**: DPDP Act compliant with Indian data protection standards
- **24/7 Availability**: Get support whenever you need it
- **Session History**: Track your wellness journey with transcripts and summaries
- **Crisis Detection**: Automatic detection and routing to crisis support resources

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication**: Clerk (Google OAuth + email/password)
- **Backend**: Next.js API Routes, Node.js, Express
- **Database**: MongoDB Atlas with Mongoose ODM
- **AI Services**: OpenAI API (LLM), Azure/ElevenLabs (TTS), Deepgram (STT)
- **Storage**: Cloudflare R2 / AWS S3 for audio files
- **Deployment**: Vercel (frontend), Railway/Render (backend)

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Clerk account for authentication
- OpenAI API key
- Audio service API keys (ElevenLabs, Deepgram, etc.)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd avichal-mind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Audio Services
   ELEVENLABS_API_KEY=your_elevenlabs_key
   DEEPGRAM_API_KEY=your_deepgram_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
avichal-mind/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── session/       # Session management
│   │   │   └── webhook/       # Clerk webhooks
│   │   ├── dashboard/         # User dashboard
│   │   ├── session/           # Session pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── providers/        # Context providers
│   │   └── session/          # Session-specific components
│   ├── lib/                  # Utility functions
│   ├── models/               # MongoDB models
│   ├── services/             # External service integrations
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions
├── public/                   # Static assets
├── scripts/                  # Database scripts
└── docs/                     # Documentation
```

## 🔧 Configuration

### Database Setup

1. Create a MongoDB Atlas cluster
2. Set up database indexes for optimal performance
3. Configure connection string in environment variables

### Authentication Setup

1. Create a Clerk application
2. Configure Google OAuth and email/password authentication
3. Set up webhook endpoints for user provisioning

### AI Services Setup

1. **OpenAI**: Set up API key for LLM responses
2. **ElevenLabs**: Configure for text-to-speech
3. **Deepgram**: Set up for speech-to-text

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📦 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Backend (Railway/Render)

1. Connect your repository
2. Set environment variables
3. Deploy the application

## 🔒 Security & Compliance

- **DPDP Act Compliance**: Indian data protection standards
- **HTTPS Everywhere**: Secure communication
- **Rate Limiting**: API protection
- **Crisis Detection**: Automatic safety measures
- **PII Masking**: Privacy protection in summaries

## 📊 Monitoring & Analytics

- **Health Checks**: Application monitoring
- **Error Tracking**: Sentry integration
- **Performance**: Lighthouse optimization
- **Analytics**: Privacy-focused user insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.avichalmind.com](https://docs.avichalmind.com)
- **Issues**: [GitHub Issues](https://github.com/avichal-mind/issues)
- **Email**: support@avichalmind.com

## 🙏 Acknowledgments

- Built with ❤️ for the Indian community
- Inspired by Talkspace and BetterHelp
- Special thanks to the mental health professionals who provided guidance

---

**Made with ❤️ for India**
