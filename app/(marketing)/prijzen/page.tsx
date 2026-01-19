import type { Metadata } from "next";
import PricingHero from "@/components/pricing/hero";
import PricingCards from "@/components/pricing/cards";
import PricingTrust from "@/components/pricing/trust";
import PricingFAQ from "@/components/pricing/faq";
import PricingCTA from "@/components/pricing/call-to-action";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://betaalme.nl";

export const metadata: Metadata = {
  title: "Prijzen - Facturatie Software vanaf €0",
  description:
    "Transparante prijzen voor BetaalMe facturatiesoftware. Start gratis, upgrade wanneer je wilt. Geen contract, maandelijks opzegbaar. Starter €0, Pro €9, Plus €19 per maand.",
  alternates: {
    canonical: `${siteUrl}/prijzen`,
  },
  openGraph: {
    title: "Prijzen - BetaalMe Facturatie Software",
    description:
      "Transparante prijzen voor facturatiesoftware. Start gratis, upgrade wanneer je wilt. Geen contract.",
    url: `${siteUrl}/prijzen`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BetaalMe Prijzen",
      },
    ],
  },
};

const faqs = [
  {
    question: "Kan ik altijd opzeggen?",
    answer: "Ja, je kunt maandelijks opzeggen zonder extra kosten.",
  },
  {
    question: "Komen er extra kosten bij?",
    answer: "Nee, de genoemde prijzen zijn de volledige kosten (excl. btw).",
  },
  {
    question: "Kan ik upgraden of downgraden?",
    answer: "Ja, je kunt altijd upgraden of downgraden naar een ander plan.",
  },
  {
    question: "Moet ik mijn creditcard opgeven?",
    answer: "Nee, voor het Starter plan niet. Betaling gaat via iDEAL.",
  },
];

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/prijzen`,
        url: `${siteUrl}/prijzen`,
        name: "Prijzen - BetaalMe Facturatie Software",
        description:
          "Transparante prijzen voor BetaalMe facturatiesoftware. Start gratis, upgrade wanneer je wilt.",
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        inLanguage: "nl-NL",
      },
      {
        "@type": "Product",
        name: "BetaalMe Starter",
        description: "Gratis facturatiesoftware voor startende zzp'ers",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          priceValidUntil: "2026-12-31",
        },
      },
      {
        "@type": "Product",
        name: "BetaalMe Pro",
        description:
          "Professionele facturatiesoftware met iDEAL-betaallink en automatische herinneringen",
        offers: {
          "@type": "Offer",
          price: "9",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          priceValidUntil: "2026-12-31",
          billingIncrement: "P1M",
        },
      },
      {
        "@type": "Product",
        name: "BetaalMe Plus",
        description:
          "Complete facturatieoplossing voor groeiende ondernemers met meerdere gebruikers",
        offers: {
          "@type": "Offer",
          price: "19",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          priceValidUntil: "2026-12-31",
          billingIncrement: "P1M",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingHero />
      <PricingCards />
      <PricingTrust />
      <PricingFAQ />
      <PricingCTA />
    </>
  );
}
