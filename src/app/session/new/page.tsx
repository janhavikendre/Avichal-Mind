'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';

export default function NewSessionPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice'>('text');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const createSession = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: selectedMode,
          language: selectedLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Session created successfully!');
        router.push(`/session/${data.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your Wellness Session
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose how you'd like to connect with your AI wellness guide. 
              You can always switch between text and voice during your session.
            </p>
          </div>

          {/* Session Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Text Session */}
                         <Card 
               className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                 selectedMode === 'text' 
                   ? 'ring-2 ring-purple-500 bg-purple-50' 
                   : 'hover:scale-105'
               }`}
               onClick={() => setSelectedMode('text')}
             >
              <CardHeader className="text-center">
                                 <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Text Session</CardTitle>
                <CardDescription>
                  Type your thoughts and feelings. Perfect for detailed conversations and when you need time to reflect.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge>✓ Private</Badge>
                    <Badge>✓ Detailed</Badge>
                    <Badge>✓ Reflective</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Best for: Deep conversations, journaling thoughts, and when you want to take your time.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Voice Session */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedMode === 'voice' 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:scale-105'
              }`}
              onClick={() => setSelectedMode('voice')}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Voice Session</CardTitle>
                <CardDescription>
                  Speak naturally and receive voice responses. Great for immediate support and emotional expression.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge>✓ Natural</Badge>
                    <Badge>✓ Immediate</Badge>
                    <Badge>✓ Emotional</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Best for: Quick support, emotional expression, and when you prefer speaking over typing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Language Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Choose Your Language</CardTitle>
              <CardDescription>
                Select the language you're most comfortable expressing yourself in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  className={`h-16 text-lg font-medium transition-all duration-200 ${
                    selectedLanguage === 'en' 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 transform scale-105 hover:bg-purple-700' 
                      : 'bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700 hover:border-purple-700 hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => setSelectedLanguage('en')}
                >
                  <span className="mr-3 text-xl">🇺🇸</span>
                  <div className="text-left">
                    <div className="font-semibold">English</div>
                    <div className="text-xs opacity-75">Primary Language</div>
                  </div>
                </Button>
                <Button
                  className={`h-16 text-lg font-medium transition-all duration-200 ${
                    selectedLanguage === 'hi' 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 transform scale-105 hover:bg-purple-700' 
                      : 'bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700 hover:border-purple-700 hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => setSelectedLanguage('hi')}
                >
                  <span className="mr-3 text-xl">🇮🇳</span>
                  <div className="text-left">
                    <div className="font-semibold">हिंदी</div>
                    <div className="text-xs opacity-75">Hindi</div>
                  </div>
                </Button>
                <Button
                  className={`h-16 text-lg font-medium transition-all duration-200 ${
                    selectedLanguage === 'mr' 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 transform scale-105 hover:bg-purple-700' 
                      : 'bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700 hover:border-purple-700 hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => setSelectedLanguage('mr')}
                >
                  <span className="mr-3 text-xl">🇮🇳</span>
                  <div className="text-left">
                    <div className="font-semibold">मराठी</div>
                    <div className="text-xs opacity-75">Marathi</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Start Session Button */}
          <div className="text-center">
            <Button
              className="text-xl px-16 py-8 bg-purple-600 hover:bg-purple-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold rounded-2xl"
              onClick={createSession}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  <span className="text-lg">Creating Session...</span>
                </>
              ) : (
                <>
                  <div className="mr-3 p-2 bg-white/20 rounded-full">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-lg">Start {selectedMode === 'voice' ? 'Voice' : 'Text'} Session</span>
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Your session will be private and secure. You can pause or end it anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
