"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PhoneInput } from "@/components/PhoneInput";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePhoneUser } from "@/hooks/usePhoneUser";
import { ArrowRight, Phone, MessageCircle, Shield, Clock, Star } from "lucide-react";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { isPhoneUser } = usePhoneUser();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className={cn("relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden", className)}>
      {/* All Content */}
      <div className="relative z-10">

      {/* Hero Section - Full Screen */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="w-full">
          {/* Hero Image with Text Overlay - Full Screen */}
          <div className="relative w-full min-h-screen overflow-hidden animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            {/* Background Image - Optimized for mobile */}
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-no-repeat bg-center sm:bg-center"
              style={{
                backgroundImage: 'url(/bg.png)',
                backgroundPosition: 'center 20%', // Show more of the girl's face on mobile
              }}
            >              
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/50 sm:bg-black/30"></div>
              
              {/* Text Content Overlay - Centered on mobile, left-aligned on desktop */}
              <div className="absolute inset-0 flex items-center justify-center sm:justify-start px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
                <div className="max-w-lg sm:max-w-2xl text-center sm:text-left ml-0 sm:ml-4 lg:ml-16 text-white w-full sm:w-auto">
                  {/* Trust Badge */}
                  <div className="inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 bg-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-semibold mb-3 sm:mb-4 lg:mb-6 animate-fade-in-up border border-white/30" style={{animationDelay: '0.4s'}}>
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Trusted by 10,000+ users worldwide</span>
                  </div>

                  {/* Main Headline - Better mobile sizing */}
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 leading-tight animate-fade-in-up drop-shadow-lg" style={{animationDelay: '0.6s'}}>
                    <span className="block">Your Personal</span>
                    <span className="block">Wellness</span>
                    <span className="block text-blue-300">AI Assistant</span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90 mb-4 sm:mb-6 lg:mb-8 leading-relaxed animate-fade-in-up font-medium drop-shadow-md max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto sm:mx-0" style={{animationDelay: '0.8s'}}>
                    Start your journey to better mental and emotional health
                  </p>

                  {/* CTA Button */}
                  <div className="animate-fade-in-up" style={{animationDelay: '1s'}}>
                    <Button 
                      onClick={handleGetStarted}
                      disabled={!isLoaded}
                      size="lg"
                      className="bg-white text-gray-800 hover:bg-gray-100 px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-auto"
                    >
                      {!isLoaded ? "Loading..." : isSignedIn ? "Go to Dashboard" : "Start Your Journey"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Preview */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-sm">Instant Chat Support</h3>
              <p className="text-gray-700 dark:text-gray-200 font-medium drop-shadow-md">Get immediate responses to your mental health questions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-sm">Voice Conversations</h3>
              <p className="text-gray-700 dark:text-gray-200 font-medium drop-shadow-md">Talk naturally with our AI assistant over phone</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 drop-shadow-sm">Safe & Private</h3>
              <p className="text-gray-700 dark:text-gray-200 font-medium drop-shadow-md">Your conversations are secure and confidential</p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Phone Support Section - Only for non-authenticated users */}
      {!isSignedIn && (
        <section id="phone-support" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Try Voice Support Now
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-medium mb-8 max-w-2xl mx-auto drop-shadow-md">
              Enter your phone number and get connected with our AI assistant for immediate mental health support
            </p>
            
            <div className="max-w-md mx-auto">
              <PhoneInput />
            </div>
            
            <p className="text-base text-gray-600 dark:text-gray-300 font-medium mt-6">
              Free to try • No commitment • Available 24/7
            </p>
          </div>
        </section>
      )}

      {/* Wellness Specialties Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">
              Find Experienced Mental Health Professionals
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Access comprehensive care across all specialties with our AI-powered mental health support system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Anxiety & Stress */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Anxiety & Stress</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    Professional support for managing anxiety, panic attacks, and stress-related concerns.
                  </p>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Get Support →
                  </button>
                </div>
              </div>
            </div>

            {/* Depression Support */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Depression Support</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    Compassionate care for depression, mood disorders, and emotional wellness.
                  </p>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Get Support →
                  </button>
                </div>
              </div>
            </div>

            {/* Sleep & Rest */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Sleep & Rest</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    Expert guidance for sleep disorders, insomnia, and healthy sleep habits.
                  </p>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Get Support →
                  </button>
                </div>
              </div>
            </div>

            {/* Relationships */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Relationships</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    Counseling for relationship issues, family dynamics, and communication skills.
                  </p>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Get Support →
                  </button>
                </div>
              </div>
            </div>

            {/* Work Stress */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m0 0v.5A1.5 1.5 0 009.5 8h5A1.5 1.5 0 0016 6.5V6M8 6H8" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Work Stress</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    Professional help for workplace stress, burnout, and work-life balance.
                  </p>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Get Support →
                  </button>
                </div>
              </div>
            </div>

            {/* Emotional Wellness */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Emotional Wellness</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    Support for emotional regulation, self-care, and overall mental wellness.
                  </p>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Get Support →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={handleGetStarted}
              variant="outline"
              size="lg"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-3 text-base font-medium rounded-lg transition-colors"
            >
              Find Mental Health Professionals
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Welcome Back Section for authenticated users */}
      {isSignedIn && (
        <section className="py-20 bg-blue-50 dark:bg-blue-900/20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome Back!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Continue your wellness journey from where you left off
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}