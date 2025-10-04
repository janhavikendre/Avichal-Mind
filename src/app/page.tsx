import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { HeroSection } from '@/components/ui/hero-section';
import { TestimonialsSection } from '@/components/ui/testimonials-section';
import { CTASection } from '@/components/ui/cta-section';
import { Footer } from '@/components/ui/footer';
import { ChatbotWidget } from '@/components/ui/chatbot-widget';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <FloatingNavbar />
      <HeroSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
