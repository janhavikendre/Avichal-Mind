"use client";

import { cn } from "@/lib/cn";

interface StatisticsSectionProps {
  className?: string;
}

const stats = [
  {
    number: "24/7",
    label: "Always Available",
    description: "Get support whenever you need it, day or night",
    icon: "🤖",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    number: "100%",
    label: "Licensed Professionals",
    description: "Connect with verified psychiatrists and clinical psychologists",
    icon: "👨‍⚕️",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    number: "📝",
    label: "Session Transcripts",
    description: "All conversations recorded for continuity and progress tracking",
    icon: "📝",
    gradient: "from-green-500 to-green-600"
  },
  {
    number: "🎤",
    label: "Text & Voice Chat",
    description: "Choose your preferred communication method for comfort",
    icon: "🎤",
    gradient: "from-pink-500 to-pink-600"
  }
];

export function StatisticsSection({ className }: StatisticsSectionProps) {
  return (
    <div className={cn("py-12 sm:py-16 bg-gray-50 dark:bg-gray-800", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Why Choose Avichal Mind?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Advanced features designed to provide the best mental health support experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-lg">
                {stat.label}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
