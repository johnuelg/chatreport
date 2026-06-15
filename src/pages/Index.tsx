import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import AIFeaturesSection from "@/components/AIFeaturesSection";
import DomainsSection from "@/components/DomainsSection";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { data: settings } = useSiteSettings();
  const v = settings?.sections_visibility ?? { hero: true, about: true, features: true, domains: true };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      {v.hero && <HeroSection />}
      {v.about && <AboutSection />}
      {v.features && <AIFeaturesSection />}
      {v.domains && <DomainsSection />}
      <Footer />
    </div>
  );
};

export default Index;
