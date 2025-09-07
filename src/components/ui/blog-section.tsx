"use client";

import { cn } from "@/lib/cn";

interface BlogSectionProps {
  className?: string;
}

const blogPosts = [
  {
    id: 1,
    category: "ANXIETY MANAGEMENT",
    title: "5 Breathing Techniques to Calm Your Mind",
    description: "Learn simple yet effective breathing exercises that can help reduce anxiety and promote relaxation in just a few minutes.",
    gradient: "from-purple-400 to-pink-400",
    icon: "💜",
    link: "#"
  },
  {
    id: 2,
    category: "GEN Z WELLNESS", 
    title: "Navigating Social Media and Mental Health",
    description: "Understanding the impact of social media on young adults and strategies for maintaining healthy digital boundaries.",
    gradient: "from-blue-400 to-teal-400",
    icon: "👥",
    link: "#"
  },
  {
    id: 3,
    category: "SENIOR CARE",
    title: "Mental Wellness in Golden Years", 
    description: "Tips for maintaining cognitive health and emotional wellbeing as we age, including community engagement strategies.",
    gradient: "from-green-400 to-blue-400",
    icon: "🍃",
    link: "#"
  },
  {
    id: 4,
    category: "WOMEN'S WELLNESS",
    title: "Postpartum Mental Health Support",
    description: "Understanding and addressing postpartum depression and anxiety with professional support and self-care strategies.",
    gradient: "from-pink-400 to-red-400", 
    icon: "👩",
    link: "#"
  },
  {
    id: 5,
    category: "TRAUMA RECOVERY",
    title: "Building Resilience After Trauma",
    description: "Evidence-based approaches to healing from traumatic experiences and building long-term emotional resilience.",
    gradient: "from-indigo-400 to-purple-400",
    icon: "🛡️",
    link: "#"
  },
  {
    id: 6,
    category: "DAILY WELLNESS",
    title: "Creating Healthy Daily Routines",
    description: "Simple habits and routines that can significantly improve your mental health and overall life satisfaction.",
    gradient: "from-yellow-400 to-orange-400",
    icon: "☀️",
    link: "#"
  }
];

export function BlogSection({ className }: BlogSectionProps) {
  return (
    <div className={cn("py-12 sm:py-16 bg-gray-50 dark:bg-gray-800", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Mental Health Resources
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Latest insights, tips, and guidance for your mental wellness journey
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className={`bg-gradient-to-r ${post.gradient} h-48 flex items-center justify-center`}>
                <span className="text-white text-4xl">{post.icon}</span>
              </div>
              <div className="p-6">
                <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                  {post.category}
                </span>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-2 mb-3">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {post.description}
                </p>
                <a 
                  href={post.link} 
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  Read More →
                </a>
              </div>
            </article>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors">
            View All Articles
          </button>
        </div>
      </div>
    </div>
  );
}
