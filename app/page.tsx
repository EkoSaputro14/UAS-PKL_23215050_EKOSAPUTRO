import LandingHeader from "@/components/landing/header";
import LandingHero from "@/components/landing/hero";
import ProductShowcase from "@/components/landing/product-showcase";
import FeatureHighlights from "@/components/landing/feature-highlights";
import TeamSection from "@/components/landing/team-section";
import SecuritySection from "@/components/landing/security-section";
import PricingSection from "@/components/landing/pricing-section";
import FaqSection from "@/components/landing/faq-section";
import LandingFooter from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <ProductShowcase />
        <FeatureHighlights />
        <TeamSection />
        <SecuritySection />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
