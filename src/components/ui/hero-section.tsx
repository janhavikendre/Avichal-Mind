"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import Link from "next/link";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div className={cn("relative min-h-screen flex items-center justify-center", className)}>
      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="inline-flex items-center px-6 py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
          AI-Powered Wellness Platform
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
          AI-Powered Mental Wellness
          <span className="block text-blue-600 dark:text-blue-400">
            for Modern India
          </span>
        </h1>

        <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
          Get compassionate, private mental health guidance through voice and text conversations. 
          Available 24/7, tailored for Indian culture and values.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <Link href="/sign-up">
            <Button className="text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">
              Start Your Journey
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-6 border-2 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full font-bold">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Secure & Private
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            24/7 Available
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Cultural Sensitivity
          </div>
        </div>
      </div>
    </div>
  );
}
