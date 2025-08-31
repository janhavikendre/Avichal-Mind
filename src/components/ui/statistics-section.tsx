"use client";

import { cn } from "@/lib/cn";

interface StatisticsSectionProps {
  className?: string;
}

const stats = [
  {
    number: "10,000+",
    label: "Sessions Completed",
    description: "Users have found support through our platform"
  },
  {
    number: "24/7",
    label: "Availability",
    description: "Round-the-clock mental wellness support"
  },
  {
    number: "3",
    label: "Languages",
    description: "English, Hindi, and Marathi support"
  },
  {
    number: "95%",
    label: "User Satisfaction",
    description: "Users report feeling better after sessions"
  }
];

export function StatisticsSection({ className }: StatisticsSectionProps) {
  return (
    <div className={cn("py-16 bg-gray-50 dark:bg-gray-800", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join the growing community of users who have found support and guidance through our platform
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
