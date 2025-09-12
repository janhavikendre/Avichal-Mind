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
    <div className={cn("relative min-h-screen flex items-center justify-center py-12 sm:py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20", className)}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8">
          {/* <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-Powered Mental Wellness Platform
          </div> */}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 lg:mb-10 leading-tight">
          Professional Mental Health
          <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2 sm:mt-3">
            Support Platform
          </span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4 sm:px-4 font-normal">
          Evidence-based AI mental wellness support with licensed professional oversight. 
          Get immediate help for anxiety, depression, and life challenges. HIPAA-compliant and available 24/7.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 lg:mb-20 px-4">
          <Button 
            onClick={handleStartJourney}
            disabled={!isLoaded}
            className="group w-full sm:w-auto text-base px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!isLoaded ? (
              "Loading..."
            ) : isSignedIn ? (
              "Access Dashboard"
            ) : (
              "Get Started"
            )}
          </Button>
          <Button 
            onClick={() => document.getElementById('phone-input')?.scrollIntoView({ behavior: 'smooth' })}
            variant="outline"
            className="group w-full sm:w-auto text-base px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 border-2 border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Voice Support
          </Button>
        </div>

        {/* Phone Input Section */}
        <div id="phone-input" className="mb-12 sm:mb-16 lg:mb-20 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-lg max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Professional Voice Support
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                Get immediate professional mental health support via phone call. Our AI assistant provides evidence-based guidance with licensed professional oversight.
              </p>
            </div>
            <PhoneInput />
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400 mb-12 sm:mb-16 px-4">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">HIPAA Compliant</span>
          </div>
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Evidence-Based</span>
          </div>
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">24/7 Available</span>
          </div>
        </div>

        {/* Platform Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Always Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Private & Secure</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">3</div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Languages</div>
            </div>
          </div>
          <p className="text-base text-gray-600 dark:text-gray-400 text-center leading-relaxed">
            Professional mental health support powered by evidence-based AI technology, designed with cultural sensitivity for diverse communities.
          </p>
        </div>
      </div>
    </div>
  );
}
