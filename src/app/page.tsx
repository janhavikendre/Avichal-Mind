import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { HeroSection } from '@/components/ui/hero-section';
import { StatisticsSection } from '@/components/ui/statistics-section';
import { FeaturesGrid } from '@/components/ui/features-grid';
import { TestimonialsSection } from '@/components/ui/testimonials-section';
import { CrisisSupport } from '@/components/ui/crisis-support';
import { CTASection } from '@/components/ui/cta-section';
import { Footer } from '@/components/ui/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <FloatingNavbar />
      <HeroSection />
      <StatisticsSection />
      <FeaturesGrid />
      <CrisisSupport className="mx-4 sm:mx-6 lg:mx-8 mb-20" />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
