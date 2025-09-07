"use client";


import { cn } from "@/lib/cn";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

interface FeaturesGridProps {
  className?: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Suicide Prevention",
    description: "24/7 crisis intervention and support for individuals experiencing suicidal thoughts",
    gradient: "from-red-500 to-red-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Gen Z Support",
    description: "Specialized support for social media anxiety, academic pressure, and identity issues",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Trauma Recovery",
    description: "PTSD treatment and trauma-informed care for healing and recovery",
    gradient: "from-green-500 to-green-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Senior Wellness",
    description: "Mental health support for aging, loneliness, and life transitions in golden years",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Women's Wellness",
    description: "Specialized support for maternal mental health, hormonal changes, and life balance",
    gradient: "from-pink-500 to-pink-600",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "General Mental Health",
    description: "Anxiety, depression, stress management, and overall emotional wellness support",
    gradient: "from-indigo-500 to-indigo-600",
  },
];

export function FeaturesGrid({ className }: FeaturesGridProps) {
  return (
    <div className={cn("py-12 sm:py-16 md:py-20", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Comprehensive Mental Health Support
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            One platform for all your mental health needs, serving every age group with specialized care
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const ageGroups = {
              "Suicide Prevention": "Emergency Support",
              "Gen Z Support": "Ages 18-25",
              "Trauma Recovery": "All Ages",
              "Senior Wellness": "Ages 65+",
              "Women's Wellness": "All Ages",
              "General Mental Health": "All Ages"
            };
            
            const badgeColors = {
              "Emergency Support": "bg-red-100 text-red-600",
              "Ages 18-25": "bg-blue-100 text-blue-600",
              "All Ages": "bg-green-100 text-green-600",
              "Ages 65+": "bg-purple-100 text-purple-600"
            };
            
            return (
              <div
                key={index}
                className="relative group"
              >
                <div className="relative bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                    {feature.description}
                  </p>
                  <div className="text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${badgeColors[ageGroups[feature.title] as keyof typeof badgeColors]}`}>
                      {ageGroups[feature.title as keyof typeof ageGroups]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
