"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "../ui/button";

const plans = [
  {
    name: "Starter",
    price: "€9,95",
    period: "/maand",
    description: "excl. BTW",
    features: [
      "Tot 10 facturen per maand",
      "Onbeperkt offertes",
      "Onkosten bijhouden",
      "BTW-overzichten",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "€19,95",
    period: "/maand",
    description: "excl. BTW",
    features: [
      "Onbeperkt facturen",
      "iDEAL betaallinks",
      "Slimme herinneringen",
      "Projecten & urenregistratie",
      "Kilometerregistratie",
      "Boekhoudkoppelingen",
    ],
    popular: true,
  },
  {
    name: "Business",
    price: "€39,95",
    period: "/maand",
    description: "excl. BTW",
    features: [
      "Alles van Professional",
      "Multi-valuta",
      "Contractbeheer",
      "Cashflow voorspellingen",
      "API toegang",
    ],
    popular: false,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const PricingSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Eerlijke prijzen, geen verrassingen
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Alle functies inbegrepen. Geen verborgen kosten.
            Start gratis en upgrade wanneer je wilt.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={item}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-foreground text-background border-2 border-foreground shadow-xl scale-105"
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
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.popular ? "text-background" : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={
                      plan.popular ? "text-background/70" : "text-muted-foreground"
                    }
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    plan.popular ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 shrink-0 ${
                        plan.popular ? "text-primary" : "text-success"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-background/90" : "text-muted-foreground"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="block mt-8">
                <Button
                  variant={plan.popular ? "secondary" : "outline"}
                  className="w-full"
                >
                  Start gratis
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          Alle prijzen zijn exclusief BTW. 14 dagen gratis proberen.{" "}
          <Link
            href="/prijzen"
            className="text-primary hover:underline font-medium"
          >
            Bekijk volledige vergelijking →
          </Link>
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;