"use client";

import { motion } from "framer-motion";
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

const BenefitsSection = () => {
  const { t } = useTranslations("benefitsSection");
  const benefits = [
    {
      stat: "🇳🇱",
      label: t("benefitsList.100%Nederlands"),
      description: t("benefitsList.100%NederlandsDescription"),
    },
    {
      stat: "30s",
      label: t("benefitsList.factuurInSeconden"),
      description: t("benefitsList.factuurInSecondenDescription"),
    },
    {
      stat: "11d",
      label: t("benefitsList.snellerBetaald"),
      description: t("benefitsList.snellerBetaaldDescription"),
    },
    {
      stat: "24/7",
      label: t("benefitsList.altijdInzicht"),
      description: t("benefitsList.altijdInzichtDescription"),
    },
  ];

  return (
    <section className="py-20 mx-4 md:mx-0 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("title")}
          </h2>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.label}
              variants={item}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {benefit.stat}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {benefit.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;