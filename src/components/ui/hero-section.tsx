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
          Trusted by 10,000+ Users Across India
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
          Professional Mental Wellness
          <span className="block text-blue-600 dark:text-blue-400">
            Support, 24/7
          </span>
        </h1>

        <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
          Get compassionate, evidence-based mental health guidance through AI-powered conversations. 
          Available anytime, anywhere, with cultural sensitivity for Indian users.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <Link href="/sign-up">
            <Button className="text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">
              Start Your Wellness Journey
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-6 border-2 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full font-bold">
              Try Free Demo
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            HIPAA Compliant & Secure
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Evidence-Based Techniques
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Cultural Sensitivity
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">User Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">3+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center italic">
            "Avichal Mind helped me find peace during my most stressful times. The AI responses are surprisingly thoughtful and culturally relevant." - Priya, Mumbai
          </p>
        </div>
      </div>
    </div>
  );
}
