'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { toast } from 'react-hot-toast';

export default function NewSessionPage() {
  const { user, isLoaded } = useUser();
  const { phoneUser, isLoading: phoneUserLoading, isPhoneUser } = usePhoneUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice'>('text');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  if (!isLoaded || phoneUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPhoneUser) {
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
          ...(isPhoneUser && phoneUser ? { phoneUserId: phoneUser._id } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Session created successfully!');
        router.push(`/session/${data.id}/continue`);
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
    <div className="h-screen bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Start Your Wellness Session
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Choose how you'd like to connect with your AI wellness guide. 
              You can always switch between text and voice during your session.
            </p>
          </div>

          {/* Session Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Text Session */}
            <Card 
              className={`cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm ${
                selectedMode === 'text' 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setSelectedMode('text')}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-white">Text Session</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Type your thoughts and feelings. Perfect for detailed conversations and when you need time to reflect.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">✓ Private</Badge>
                    <Badge className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">✓ Detailed</Badge>
                    <Badge className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">✓ Reflective</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Best for: Deep conversations, journaling thoughts, and when you want to take your time.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Voice Session */}
            <Card 
              className={`cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm ${
                selectedMode === 'voice' 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setSelectedMode('voice')}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-white">Voice Session</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Speak naturally and receive voice responses. Great for immediate support and emotional expression.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">✓ Natural</Badge>
                    <Badge className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">✓ Immediate</Badge>
                    <Badge className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">✓ Emotional</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Best for: Quick support, emotional expression, and when you prefer speaking over typing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Language Selection */}
          <Card className="mb-6 sm:mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">Choose Your Language</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Select the language you're most comfortable expressing yourself in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Button
                  className={`h-12 sm:h-16 text-sm sm:text-lg font-medium ${
                    selectedLanguage === 'en' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105 hover:bg-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedLanguage('en')}
                >
                  <span className="mr-2 sm:mr-3 text-lg sm:text-xl">🇺🇸</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">English</div>
                    <div className="text-xs opacity-75">Primary Language</div>
                  </div>
                </Button>
                <Button
                  className={`h-12 sm:h-16 text-sm sm:text-lg font-medium ${
                    selectedLanguage === 'hi' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105 hover:bg-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedLanguage('hi')}
                >
                  <span className="mr-2 sm:mr-3 text-lg sm:text-xl">🇮🇳</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">हिंदी</div>
                    <div className="text-xs opacity-75">Hindi</div>
                  </div>
                </Button>
                <Button
                  className={`h-12 sm:h-16 text-sm sm:text-lg font-medium ${
                    selectedLanguage === 'mr' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105 hover:bg-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedLanguage('mr')}
                >
                  <span className="mr-2 sm:mr-3 text-lg sm:text-xl">🇮🇳</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">मराठी</div>
                    <div className="text-xs opacity-75">Marathi</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Start Session Button */}
          <div className="text-center">
            <Button
              className="text-lg sm:text-xl px-8 sm:px-16 py-4 sm:py-6 bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl"
              onClick={createSession}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                  <span className="text-base sm:text-lg">Creating Session...</span>
                </>
              ) : (
                <>
                  <div className="mr-2 sm:mr-3 p-1 sm:p-2 bg-white/20 rounded-full">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-base sm:text-lg">Start {selectedMode === 'voice' ? 'Voice' : 'Text'} Session</span>
                </>
              )}
            </Button>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 px-4">
              Your session will be private and secure. You can pause or end it anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
