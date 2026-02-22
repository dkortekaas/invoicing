"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";

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
  const { t, lp } = useTranslations("pricingSection");

  const plans = [
    {
      name: t("free"),
      price: "€0",
      period: "",
      description: "",
      features: [
        t("freeFeatures1"),
        t("freeFeatures2"),
        t("freeFeatures3"),
        t("freeFeatures4"),
      ],
      popular: false,
    },
    {
      name: t("starter"),
      price: "€9,95",
      period: t("perMonth"),
      description: t("exclVAT"),
      features: [
        t("starterFeatures1"),
        t("starterFeatures2"),
        t("starterFeatures3"),
        t("starterFeatures4"),
      ],
      popular: false,
    },
    {
      name: t("professional"),
      price: "€19,95",
      period: t("perMonth"),
      description: t("exclVAT"),
      features: [
        t("professionalFeatures1"),
        t("professionalFeatures2"),
        t("professionalFeatures3"),
        t("professionalFeatures4"),
        t("professionalFeatures5"),
        t("professionalFeatures6"),
      ],
      popular: true,
    },
    {
      name: t("business"),
      price: "€34,95",
      period: t("perMonth"),
      description: t("exclVAT"),
      features: [
        t("businessFeatures1"),
        t("businessFeatures2"),
        t("businessFeatures3"),
        t("businessFeatures4"),
        t("businessFeatures5"),
      ],
      popular: false,
    },
  ];

  return (
    <section className="py-20 px-6 md:px-0 md:py-28 bg-background">
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
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={item}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-foreground text-background border-2 border-foreground shadow-xl lg:scale-105"
                  : "bg-card border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  {t("mostPopular")}
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
                  {plan.period && (
                    <span
                      className={
                        plan.popular ? "text-background/70" : "text-muted-foreground"
                      }
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.description && (
                  <p
                    className={`text-sm mt-1 ${
                      plan.popular ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {plan.description}
                  </p>
                )}
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
                  {t("startFree")}
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
          {t("allPricesAreExclVAT")} {t("freeTrial")}.{" "}
          <Link
            href={lp("/prijzen")}
            className="text-primary hover:underline font-medium"
          >
            {t("viewFullComparison")} →
          </Link>
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
