'use client';

import { Fragment, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 9.95,
    yearlyPrice: 7.95,
    description: "Voor starters en kleine ondernemers",
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 19.95,
    yearlyPrice: 15.95,
    description: "Voor groeiende ondernemers",
    popular: true,
  },
  {
    name: "Business",
    monthlyPrice: 39.95,
    yearlyPrice: 31.95,
    description: "Voor professionals en teams",
    popular: false,
  },
];

const featureCategories = [
  {
    name: "Facturatie",
    features: [
      { name: "Facturen per maand", starter: "10", professional: "Onbeperkt", business: "Onbeperkt" },
      { name: "Offertes", starter: true, professional: true, business: true },
      { name: "Credit nota's", starter: true, professional: true, business: true },
      { name: "Terugkerende facturen", starter: false, professional: true, business: true },
      { name: "Eigen huisstijl & logo", starter: true, professional: true, business: true },
      { name: "Meerdere templates", starter: false, professional: true, business: true },
      { name: "Digitale ondertekening", starter: false, professional: true, business: true },
    ],
  },
  {
    name: "Betalingen",
    features: [
      { name: "iDEAL betaallinks", starter: false, professional: true, business: true },
      { name: "Creditcard betalingen", starter: false, professional: true, business: true },
      { name: "Automatische herinneringen", starter: false, professional: true, business: true },
      { name: "Slimme AI herinneringen", starter: false, professional: true, business: true },
      { name: "Klantportaal", starter: false, professional: false, business: true },
    ],
  },
  {
    name: "Onkosten & Administratie",
    features: [
      { name: "Onkosten bijhouden", starter: true, professional: true, business: true },
      { name: "OCR bonnetjes scannen", starter: false, professional: true, business: true },
      { name: "Kilometerregistratie", starter: false, professional: true, business: true },
      { name: "Categorieën beheer", starter: true, professional: true, business: true },
    ],
  },
  {
    name: "Projecten & Tijd",
    features: [
      { name: "Projecten aanmaken", starter: false, professional: true, business: true },
      { name: "Urenregistratie", starter: false, professional: true, business: true },
      { name: "Factureren vanuit uren", starter: false, professional: true, business: true },
      { name: "Budgetbewaking", starter: false, professional: false, business: true },
    ],
  },
  {
    name: "Rapportages & Belasting",
    features: [
      { name: "BTW-overzichten", starter: true, professional: true, business: true },
      { name: "Inkomstenbelasting overzicht", starter: false, professional: true, business: true },
      { name: "Cashflow voorspellingen", starter: false, professional: false, business: true },
      { name: "Export naar Excel/CSV", starter: true, professional: true, business: true },
    ],
  },
  {
    name: "Integraties & Extra",
    features: [
      { name: "Boekhoudkoppelingen", starter: false, professional: true, business: true },
      { name: "Multi-valuta", starter: false, professional: false, business: true },
      { name: "Contractbeheer", starter: false, professional: false, business: true },
      { name: "API toegang", starter: false, professional: false, business: true },
      { name: "Webhooks", starter: false, professional: false, business: true },
    ],
  },
  {
    name: "Support",
    features: [
      { name: "Email support", starter: true, professional: true, business: true },
      { name: "Prioriteit support", starter: false, professional: true, business: true },
      { name: "Dedicated accountmanager", starter: false, professional: false, business: true },
    ],
  },
];

const pricingFaqs = [
  {
    question: "Kan ik Declair gratis proberen?",
    answer:
      "Ja! Je krijgt 14 dagen gratis toegang tot alle Professional functies. Geen creditcard nodig. Na de proefperiode kies je zelf of en welk abonnement bij je past.",
  },
  {
    question: "Kan ik op elk moment upgraden of downgraden?",
    answer:
      "Ja, je kunt op elk moment je abonnement aanpassen. Bij een upgrade krijg je direct toegang tot de nieuwe functies. Bij een downgrade blijft je huidige abonnement actief tot het einde van de periode.",
  },
  {
    question: "Wat zijn de transactiekosten voor betalingen?",
    answer:
      "Declair rekent geen transactiekosten. Je betaalt alleen de kosten van de betaalprovider (Mollie): €0,29 per iDEAL transactie en 1,8% + €0,25 voor creditcard.",
  },
  {
    question: "Kan ik maandelijks opzeggen?",
    answer:
      "Ja, je kunt op elk moment opzeggen. Je houdt toegang tot je account tot het einde van je betaalperiode. Je data kun je altijd exporteren.",
  },
  {
    question: "Krijg ik korting bij jaarlijkse betaling?",
    answer:
      "Ja! Bij jaarlijkse betaling krijg je 2 maanden gratis. Dat is een besparing van meer dan 16%.",
  },
  {
    question: "Zijn de prijzen inclusief of exclusief BTW?",
    answer:
      "Alle genoemde prijzen zijn exclusief 21% BTW. Als ondernemer kun je de BTW vaak aftrekken.",
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-foreground font-medium">{value}</span>;
    }
    return value ? (
      <Check className="w-5 h-5 text-success mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
    );
  };

  return (
      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-gradient-hero">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Eerlijke prijzen, geen verrassingen
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Alle functies inbegrepen. Geen verborgen kosten.
                Groeit mee met je onderneming.
              </p>

              {/* Billing Toggle */}
              <div className="mt-8 inline-flex items-center gap-4 bg-muted/50 rounded-full p-1.5">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !isYearly
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Maandelijks
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    isYearly
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Jaarlijks
                  <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                    2 maanden gratis
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular
                      ? "bg-foreground text-background border-2 border-foreground shadow-xl md:scale-105"
                      : "bg-card border border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Meest gekozen
                    </div>
                  )}
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        plan.popular ? "text-background" : "text-foreground"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        plan.popular ? "text-background/70" : "text-muted-foreground"
                      }`}
                    >
                      {plan.description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-bold ${
                          plan.popular ? "text-background" : "text-foreground"
                        }`}
                      >
                        €{isYearly ? plan.yearlyPrice.toFixed(2).replace(".", ",") : plan.monthlyPrice.toFixed(2).replace(".", ",")}
                      </span>
                      <span
                        className={
                          plan.popular ? "text-background/70" : "text-muted-foreground"
                        }
                      >
                        /maand
                      </span>
                    </div>
                    {isYearly && (
                      <p
                        className={`text-sm mt-1 ${
                          plan.popular ? "text-background/70" : "text-muted-foreground"
                        }`}
                      >
                        Jaarlijks gefactureerd (€{(plan.yearlyPrice * 12).toFixed(2).replace(".", ",")}/jaar)
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        plan.popular ? "text-background/50" : "text-muted-foreground"
                      }`}
                    >
                      excl. BTW
                    </p>
                  </div>

                  <Link href="/register" className="block mt-8">
                    <Button
                      variant={plan.popular ? "secondary" : "outline"}
                      className="w-full gap-2"
                    >
                      Start gratis
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Vergelijk alle features
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto overflow-x-auto"
            >
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-32">
                      Starter
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-32 bg-primary/5">
                      Professional
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-32">
                      Business
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((category) => (
                    <Fragment key={category.name}>
                      <tr className="bg-muted/50">
                        <td
                          colSpan={4}
                          className="py-3 px-4 font-semibold text-foreground text-sm"
                        >
                          {category.name}
                        </td>
                      </tr>
                      {category.features.map((feature, index) => (
                        <tr
                          key={`${category.name}-${index}`}
                          className="border-b border-border/50"
                        >
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {feature.name}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {renderFeatureValue(feature.starter)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm bg-primary/5">
                            {renderFeatureValue(feature.professional)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {renderFeatureValue(feature.business)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Veelgestelde vragen over prijzen
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="max-w-3xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-4">
                {pricingFaqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="bg-card border border-border rounded-xl px-6"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-cta relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                Nog niet zeker welk plan?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Start met 14 dagen gratis en ontdek welk plan het beste bij je past.
                Geen creditcard nodig, opzeggen wanneer je wilt.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Start gratis proefperiode
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Contact opnemen
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
  );
};

export default Pricing;