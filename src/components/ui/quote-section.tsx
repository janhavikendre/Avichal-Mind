"use client";

import { cn } from "@/lib/cn";

interface QuoteSectionProps {
  className?: string;
  variant?: 'first' | 'second';
}

export function QuoteSection({ className, variant = 'first' }: QuoteSectionProps) {
  const quotes = {
    first: {
      text: "Mental health is not a destination, but a process. It's about how you drive, not where you're going.",
      author: "- Noam Shpancer"
    },
    second: {
      text: "You are not alone in this. Every step towards healing is a victory, no matter how small.",
      author: "- Avichal Mind Team"
    }
  };

  const currentQuote = quotes[variant];

  return (
    <div className={cn("py-12 sm:py-16 bg-white dark:bg-gray-900", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-8 rounded-lg text-center border-l-4 border-purple-500">
          <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-800 dark:text-white mb-4">
            "{currentQuote.text}"
          </blockquote>
          <cite className="text-purple-600 dark:text-purple-400 font-semibold text-lg">
            {currentQuote.author}
          </cite>
        </div>
      </div>
    </div>
  );
}
