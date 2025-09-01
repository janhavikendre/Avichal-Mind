"use client";

import { cn } from "@/lib/cn";

interface StatisticsSectionProps {
  className?: string;
}

const stats = [
  {
    number: "24/7",
    label: "Always Available",
    description: "Get support whenever you need it, day or night"
  },
  {
    number: "3",
    label: "Languages Supported",
    description: "English, Hindi, and Marathi with cultural context"
  },
  {
    number: "100%",
    label: "Private & Secure",
    description: "Your conversations are confidential and protected"
  },
  {
    number: "0",
    label: "Waiting Time",
    description: "Instant responses, no appointments or delays"
  }
];

export function StatisticsSection({ className }: StatisticsSectionProps) {
  return (
    <div className={cn("py-16 bg-gray-50 dark:bg-gray-800", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Avichal Mind?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of mental wellness with our innovative AI-powered platform
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-blue-600 dark:text-blue-400">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
              </div>
              <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
