"use client";

import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialsSectionProps {
  className?: string;
}

const features = [
  {
    icon: "💬",
    title: "Start a Conversation",
    description: "Begin your wellness journey by typing or speaking your concerns. Our AI understands context and provides personalized guidance."
  },
  {
    icon: "🎯",
    title: "Get Personalized Support",
    description: "Receive evidence-based advice, breathing exercises, and coping strategies tailored to your specific situation and cultural background."
  },
  {
    icon: "📝",
    title: "Track Your Progress",
    description: "Every session is automatically summarized and saved. Review your journey and see how far you've come in your mental wellness."
  },
  {
    icon: "🔒",
    title: "Complete Privacy",
    description: "Your conversations are private and secure. No human therapists, no judgment - just confidential AI support when you need it."
  },
  {
    icon: "🌍",
    title: "Cultural Understanding",
    description: "Built specifically for Indian users with support for English, Hindi, and Marathi. Understands family dynamics and social pressures."
  },
  {
    icon: "⚡",
    title: "Instant Availability",
    description: "No appointments, no waiting. Get immediate support 24/7 whenever you need someone to talk to or guidance on mental wellness."
  }
];

export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  return (
    <div className={cn("py-20 bg-gray-50 dark:bg-gray-800", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your journey to better mental wellness starts here. Simple, private, and always available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
