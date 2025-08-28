import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { HeroSection } from '@/components/ui/hero-section';
import { FeaturesGrid } from '@/components/ui/features-grid';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <FloatingNavbar />
      <HeroSection />
      <FeaturesGrid />
    </div>
  );
}
