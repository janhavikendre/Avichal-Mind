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
            Ready to Start Your Wellness Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have found support, guidance, and peace of mind through our AI-powered platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/sign-up">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold rounded-full">
                Get Started Free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-bold rounded-full">
                Learn More
              </Button>
            </Link>
          </div>
          
          <p className="text-blue-100 mt-6 text-sm">
            No credit card required • Start your first session in minutes
          </p>
        </div>
      </div>
    </div>
  );
}
