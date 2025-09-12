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
            <div key={index} className="relative bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
              {/* Background wellness patterns */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {index === 0 && (
                    // Clock pattern for 24/7
                    <>
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3" fill="none"/>
                      <line x1="50" y1="50" x2="50" y2="25" stroke="currentColor" strokeWidth="3"/>
                      <line x1="50" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="50" cy="50" r="3" fill="currentColor"/>
                    </>
                  )}
                  {index === 1 && (
                    // Medical cross pattern
                    <>
                      <rect x="45" y="20" width="10" height="60" fill="currentColor"/>
                      <rect x="20" y="45" width="60" height="10" fill="currentColor"/>
                      <circle cx="30" cy="30" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="70" cy="70" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </>
                  )}
                  {index === 2 && (
                    // Document waves pattern
                    <>
                      <rect x="25" y="20" width="50" height="60" stroke="currentColor" strokeWidth="2" fill="none" rx="5"/>
                      <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="2"/>
                      <line x1="35" y1="45" x2="60" y2="45" stroke="currentColor" strokeWidth="2"/>
                      <line x1="35" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth="2"/>
                      <line x1="35" y1="65" x2="55" y2="65" stroke="currentColor" strokeWidth="2"/>
                    </>
                  )}
                  {index === 3 && (
                    // Sound waves pattern
                    <>
                      <path d="M20 50 Q35 35, 50 50 Q65 65, 80 50" stroke="currentColor" strokeWidth="3" fill="none"/>
                      <path d="M15 50 Q30 30, 50 50 Q70 70, 85 50" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M25 50 Q40 40, 50 50 Q60 60, 75 50" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="50" cy="50" r="5" fill="currentColor"/>
                    </>
                  )}
                </svg>
              </div>
              
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-full flex items-center justify-center mx-auto mb-4 relative z-10`}>
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
