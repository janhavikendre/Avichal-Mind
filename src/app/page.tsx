import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { HeroSection } from '@/components/ui/hero-section';
import { QuoteSection } from '@/components/ui/quote-section';
import { FeaturesGrid } from '@/components/ui/features-grid';
import { HowItWorks } from '@/components/ui/how-it-works';
import { StatisticsSection } from '@/components/ui/statistics-section';
import { BlogSection } from '@/components/ui/blog-section';
import { TestimonialsSection } from '@/components/ui/testimonials-section';
import { CrisisSupport } from '@/components/ui/crisis-support';
import { CTASection } from '@/components/ui/cta-section';
import { Footer } from '@/components/ui/footer';
import { ChatbotWidget } from '@/components/ui/chatbot-widget';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <FloatingNavbar />
      <HeroSection />
      <QuoteSection />
      <FeaturesGrid />
      <HowItWorks />
      <StatisticsSection />
      <BlogSection />
      <QuoteSection variant="second" />
      <CrisisSupport className="mx-4 sm:mx-6 lg:mx-8 mb-20" />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
