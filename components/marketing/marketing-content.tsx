"use client";

import HeroSection from "@/components/marketing/hero-section";
import FeaturesSection from "@/components/marketing/features-section";
import BenefitsSection from "@/components/marketing/benefits-section";
import TestimonialsSection from "@/components/marketing/testimonial-section";
import PricingSection from "@/components/marketing/pricing-section";
import FAQSection from "@/components/marketing/faq-section";
import CTASection from "@/components/marketing/cta-section";
import { useTranslations } from "@/components/providers/locale-provider";

/**
 * Client-only wrapper for all marketing sections that use framer-motion.
 * Loaded with dynamic(..., { ssr: false }) to avoid motion running during SSR
 * and prevent "createContext is not a function" / hydration issues.
 */
export default function MarketingContent() {
  const { t } = useTranslations("cta");
  
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
      <CTASection
        title={t("title")}
        description={t("description")}
        linkHref1={t("linkHref1")}
        linkText1={t("linkText1")}
        checkText1={t("checkText1")}
        checkText2={t("checkText2")}
        checkText3={t("checkText3")}
      />
    </>
  );
}
