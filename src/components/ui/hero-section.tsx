"use client";


import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import Link from "next/link";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div className={cn("relative min-h-screen flex items-center justify-center overflow-hidden", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950" />
      


      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
                 <div className="inline-flex items-center px-4 py-2 bg-purple-100/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
           <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
           AI-Powered Wellness Platform
         </div>

                 <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          AI-Powered Mental Wellness
          <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            for Modern India
          </span>
                 </h1>

                 <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Get compassionate, private mental health guidance through voice and text conversations. 
          Available 24/7, tailored for Indian culture and values.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sign-up">
            <Button className="text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">
              Start Your Journey
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 border-2 border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950/20 rounded-full font-bold">
              Learn More
            </Button>
          </Link>
        </div>
      </div>


    </div>
  );
}
