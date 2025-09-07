"use client";

import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialsSectionProps {
  className?: string;
}

const testimonials = [
  {
    id: 1,
    quote: "AVI was there for me at 3 AM when I needed someone the most. The instant connection to a professional saved my life.",
    author: "Sarah, 24",
    color: "bg-purple-50 dark:bg-purple-900/20",
    textColor: "text-purple-600 dark:text-purple-400"
  },
  {
    id: 2,
    quote: "As a senior, I was hesitant about online therapy. But the platform is so easy to use, and my therapist is wonderful.",
    author: "Robert, 72",
    color: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-600 dark:text-blue-400"
  },
  {
    id: 3,
    quote: "The postpartum support I received here helped me through the darkest period of my life. I'm forever grateful.",
    author: "Maria, 31",
    color: "bg-pink-50 dark:bg-pink-900/20",
    textColor: "text-pink-600 dark:text-pink-400"
  }
];

export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  return (
    <div className={cn("py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            What Our Users Say
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Real stories from people who found support and healing through Avichal Mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className={`${testimonial.color} rounded-lg p-8 text-center`}>
              <div className={`${testimonial.textColor} mb-4`}>
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className={`${testimonial.textColor} font-semibold`}>
                {testimonial.author}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
