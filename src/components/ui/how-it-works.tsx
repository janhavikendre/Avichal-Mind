"use client";

import { cn } from "@/lib/cn";

interface HowItWorksProps {
  className?: string;
}

const steps = [
  {
    number: "1",
    title: "Search for Doctors",
    description: "Find experienced mental health professionals across all specialties. Browse profiles, read reviews, and check availability.",
    color: "bg-blue-100 text-blue-600"
  },
  {
    number: "2", 
    title: "Book Appointment",
    description: "Schedule your consultation at your convenience. Choose between online video calls or in-person clinic visits.",
    color: "bg-green-100 text-green-600"
  },
  {
    number: "3",
    title: "Consult & Follow-up", 
    description: "Meet with your chosen specialist for comprehensive mental health care. Receive ongoing support and treatment recommendations.",
    color: "bg-purple-100 text-purple-600"
  }
];

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <div className={cn("py-12 sm:py-16 bg-white dark:bg-gray-900", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Book an appointment for an in-clinic consultation
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Find experienced doctors across all specialties for comprehensive mental health care
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
