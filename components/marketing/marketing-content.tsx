"use client";

import HeroSection from "@/components/marketing/hero-section";
import FeaturesSection from "@/components/marketing/features-section";
import BenefitsSection from "@/components/marketing/benefits-section";
import TestimonialsSection from "@/components/marketing/testimonial-section";
import PricingSection from "@/components/marketing/pricing-section";
import FAQSection from "@/components/marketing/faq-section";
import CTASection from "@/components/marketing/cta-section";

/**
 * Client-only wrapper for all marketing sections that use framer-motion.
 * Loaded with dynamic(..., { ssr: false }) to avoid motion running during SSR
 * and prevent "createContext is not a function" / hydration issues.
 */
export default function MarketingContent() {
  return (
    <>
      <HeroSection />
      <div className="container mx-auto">
        <FeaturesSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </div>
      <CTASection />
    </>
  );
}
