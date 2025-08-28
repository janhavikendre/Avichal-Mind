'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
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
            <AnimatedCard>
                             <Card 
                 className={`cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
                   selectedMode === 'text' 
                     ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                     : ''
                 }`}
                 onClick={() => setSelectedMode('text')}
               >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
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
                       <Badge className="text-xs sm:text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✓ Private</Badge>
                       <Badge className="text-xs sm:text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✓ Detailed</Badge>
                       <Badge className="text-xs sm:text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✓ Reflective</Badge>
                     </div>
                     <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                       Best for: Deep conversations, journaling thoughts, and when you want to take your time.
                     </p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Voice Session */}
            <AnimatedCard>
                             <Card 
                 className={`cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
                   selectedMode === 'voice' 
                     ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                     : ''
                 }`}
                 onClick={() => setSelectedMode('voice')}
               >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
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
                       <Badge className="text-xs sm:text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✓ Natural</Badge>
                       <Badge className="text-xs sm:text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✓ Immediate</Badge>
                       <Badge className="text-xs sm:text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">✓ Emotional</Badge>
                     </div>
                     <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                       Best for: Quick support, emotional expression, and when you prefer speaking over typing.
                     </p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>

          {/* Language Selection */}
          <AnimatedCard>
                         <Card className="mb-6 sm:mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
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
                        : 'bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700'
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
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25 transform scale-105 hover:bg-green-700' 
                        : 'bg-green-600 text-white border-2 border-green-600 hover:bg-green-700 hover:border-green-700'
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
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25 transform scale-105 hover:bg-orange-700' 
                        : 'bg-orange-600 text-white border-2 border-orange-600 hover:bg-orange-700 hover:border-orange-700'
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
          </AnimatedCard>

          {/* Start Session Button */}
          <div className="text-center">
            <Button
              className="text-lg sm:text-xl px-8 sm:px-16 py-4 sm:py-8 bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl w-full sm:w-auto"
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
