"use client";

import { cn } from "@/lib/cn";

interface HowItWorksProps {
  className?: string;
}

const steps = [
  {
    number: "1",
    title: "Connect with AVI",
    description: "Start by chatting with our AI assistant AVI through text or voice. Share your feelings and concerns in a safe, judgment-free environment.",
    color: "bg-purple-100 text-purple-600"
  },
  {
    number: "2", 
    title: "Get Matched",
    description: "Based on your needs and preferences, we connect you with licensed psychiatrists or clinical psychologists specialized in your concerns.",
    color: "bg-blue-100 text-blue-600"
  },
  {
    number: "3",
    title: "Start Healing", 
    description: "Begin your therapeutic journey with continuous support. All conversations are recorded for continuity and better care coordination.",
    color: "bg-green-100 text-green-600"
  }
];

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <div className={cn("py-12 sm:py-16 bg-white dark:bg-gray-900", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            How Avichal Mind Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Simple, secure, and effective mental health support in three easy steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <span className="text-3xl font-bold">{step.number}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
