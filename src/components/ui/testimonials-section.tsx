"use client";

import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialsSectionProps {
  className?: string;
}

const testimonials = [
  {
    name: "Dr. Priya Sharma",
    role: "Medical Professional",
    content: "As someone in healthcare, I was skeptical about AI therapy. But Avichal Mind's evidence-based approach and cultural sensitivity exceeded my expectations. The breathing techniques and stress management strategies are genuinely helpful.",
    rating: 5
  },
  {
    name: "Rajesh Kumar",
    role: "Tech Executive",
    content: "The 24/7 availability and immediate response time make this platform invaluable. I can get support whenever I need it, and the AI responses are surprisingly thoughtful and culturally relevant to Indian work culture.",
    rating: 5
  },
  {
    name: "Anjali Patel",
    role: "Mental Health Advocate",
    content: "I've tried many mental health platforms, but Avichal Mind's understanding of Indian family dynamics and social pressures sets it apart. The Hindi language support makes it accessible to my entire family.",
    rating: 5
  },
  {
    name: "Arjun Singh",
    role: "Graduate Student",
    content: "Dealing with academic pressure and homesickness was overwhelming. This platform provided practical coping strategies that I could implement immediately. The voice feature is incredibly convenient.",
    rating: 5
  },
  {
    name: "Meera Reddy",
    role: "Working Mother",
    content: "Balancing career and family responsibilities was taking a toll on my mental health. Avichal Mind helped me develop healthy boundaries and self-care routines that fit my busy lifestyle.",
    rating: 5
  },
  {
    name: "Vikram Malhotra",
    role: "Entrepreneur",
    content: "Running a business in India comes with unique challenges. The platform's cultural understanding and practical advice helped me manage stress and maintain work-life balance effectively.",
    rating: 5
  }
];

export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  return (
    <div className={cn("py-20 bg-white dark:bg-gray-900", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Mental Health Professionals & Users
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Real stories from diverse users who have experienced genuine improvements in their mental wellness
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
