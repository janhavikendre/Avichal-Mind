"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PhoneInput } from "@/components/PhoneInput";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleStartJourney = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className={cn("relative min-h-screen flex items-center justify-center py-12 sm:py-16", className)}>
      {/* Content */}
      <div className="relative z-10 text-center px-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="inline-flex items-center px-6 sm:px-6 py-3 sm:py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm sm:text-sm font-medium mb-8 sm:mb-10">
          <span className="w-2 h-2 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-3 sm:mr-3" />
          <span className="hidden sm:inline">Innovative AI-Powered Mental Wellness Platform</span>
          <span className="sm:hidden">AI-Powered Wellness</span>
        </div>

        <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 lg:mb-10 leading-tight">
          Professional Mental Wellness
          <span className="block text-blue-600 dark:text-blue-400 mt-2 sm:mt-3">
            Support, 24/7
          </span>
        </h1>

        <p className="text-base sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-4">
          Get compassionate, evidence-based mental health guidance through AI-powered conversations. 
          Available anytime, anywhere, with cultural sensitivity for Indian users.
        </p>

        <div className="flex justify-center items-center mb-8 sm:mb-10 lg:mb-12 px-4">
          <Button 
            onClick={handleStartJourney}
            disabled={!isLoaded}
            className="w-full sm:w-auto text-base sm:text-base lg:text-lg px-8 sm:px-8 lg:px-12 py-4 sm:py-4 lg:py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {!isLoaded ? (
              "Loading..."
            ) : isSignedIn ? (
              "Go to Dashboard"
            ) : (
              "Start Your Wellness Journey"
            )}
          </Button>
        </div>

        {/* Phone Input Section */}
        <div className="mb-8 sm:mb-10 lg:mb-12 px-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 sm:p-8 border border-blue-200/50 dark:border-blue-800/50">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Get Instant AI Support via Phone
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Enter your mobile number to receive a call from our AI wellness assistant. Available 24/7 for immediate support.
              </p>
            </div>
            <PhoneInput />
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-sm sm:text-sm text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 px-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2 sm:mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">HIPAA Compliant & Secure</span>
            <span className="sm:hidden">HIPAA Compliant</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2 sm:mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Evidence-Based Techniques</span>
            <span className="sm:hidden">Evidence-Based</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2 sm:mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Cultural Sensitivity</span>
            <span className="sm:hidden">Cultural</span>
          </div>
        </div>

        {/* Platform Features */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-4 lg:p-6 max-w-3xl mx-auto mx-2 sm:mx-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-8 mb-4 sm:mb-4 lg:mb-6">
            <div className="text-center">
              <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Always Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Private & Secure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-blue-600">3</div>
              <div className="text-sm sm:text-sm text-gray-600 dark:text-gray-400">Languages</div>
            </div>
          </div>
          <p className="text-sm sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 text-center italic px-2">
            Experience the future of mental wellness with our innovative AI platform designed specifically for Indian users.
          </p>
        </div>
      </div>
    </div>
  );
}
