import PricingHero from "@/components/pricing/hero";
import PricingCards from "@/components/pricing/cards";
import PricingTrust from "@/components/pricing/trust";
import PricingFAQ from "@/components/pricing/faq";
import PricingCTA from "@/components/pricing/call-to-action";

const Pricing = () => {
  return (
    <>
        <PricingHero />
        <PricingCards />
        <PricingTrust />
        <PricingFAQ />
        <PricingCTA />
    </>
  );
};

export default Pricing;
