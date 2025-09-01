"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CTASectionProps {
  className?: string;
}

export function CTASection({ className }: CTASectionProps) {
  return (
    <div className={cn("py-20 bg-blue-600", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Take Control of Your Mental Wellness Today
          </h2>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
            Experience the future of mental wellness with our innovative AI-powered platform. 
            Get professional guidance anytime, anywhere - no waiting, no appointments, just immediate help when you need it most.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/sign-up">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 text-lg font-bold rounded-full">
                Start Your Free Session
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-2 border-white text-blue-600 hover:bg-white/10 px-10 py-4 text-lg font-bold rounded-full">
                See How It Works
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white text-sm mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Start in under 2 minutes
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              HIPAA compliant & secure
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
