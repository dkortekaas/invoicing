"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "Voor de startende zzp'er",
    features: [
      "Facturen maken",
      "Onbeperkt klanten",
      "PDF facturen",
      "Betaalstatus overzicht",
    ],
    cta: "Gratis starten",
    link: "/register",
    popular: false,
  },
  {
    name: "Pro",
    price: "9",
    description: "Voor zzp'ers die sneller betaald willen worden",
    features: [
      "Alles van Starter",
      "iDEAL-betaallink",
      "Automatische betaalherinneringen",
    ],
    cta: "Start Pro",
    popular: true,
    link: "/register",
  },
  {
    name: "Plus",
    price: "19",
    description: "Voor groeiende ondernemers",
    features: [
      "Alles van Pro",
      "Eigen factuurlayout",
      "Meerdere gebruikers",
      "Export voor boekhouder",
      "Prioriteit support",
    ],
    cta: "Start Plus",
    popular: false,
    link: "/register",
  },
];

const PricingCards = () => {
  return (
    <section className="relative">
      <div className="container-tight section-padding !pt-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`relative rounded-2xl p-6 lg:p-8 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-2xl scale-[1.02] md:scale-105 z-10 border-2 border-primary"
                  : "bg-background border-2 border-border hover:border-primary/30 transition-colors"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    Meest gekozen
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                
                {/* Price - big and bold */}
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className={`text-5xl lg:text-6xl font-extrabold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    €{plan.price}
                  </span>
                  {plan.price !== "0" && (
                    <span className={`text-lg ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      / maand
                    </span>
                  )}
                </div>

                <p className={`text-sm ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-accent" : "text-primary"}`} />
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : plan.price === "0" ? "default" : "outline"}
                size="lg"
                className={`w-full ${plan.popular ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}
                asChild
              >
                <Link href={plan.link}>
                {plan.cta}
                </Link>
              </Button>

              {/* Monthly cancellation reminder */}
              <p className={`text-xs text-center mt-4 ${plan.popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                Maandelijks opzegbaar
              </p>
            </motion.div>
          ))}
        </div>

        {/* Price note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Prijzen exclusief btw
        </motion.p>
      </div>
    </section>
  );
};

export default PricingCards;
