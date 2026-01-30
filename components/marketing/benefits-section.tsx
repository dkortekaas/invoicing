"use client";

import { motion } from "framer-motion";

const benefits = [
  {
    stat: "🇳🇱",
    label: "100% Nederlands",
    description: "Gebouwd voor Nederland. KvK-validatie, BTW en iDEAL ingebouwd.",
  },
  {
    stat: "30s",
    label: "Factuur in seconden",
    description: "Van lege pagina naar verzonden factuur in minder dan een minuut.",
  },
  {
    stat: "11d",
    label: "Sneller betaald",
    description: "Gemiddeld 11 dagen sneller betaald dankzij betaallinks en herinneringen.",
  },
  {
    stat: "24/7",
    label: "Altijd inzicht",
    description: "Real-time dashboards en rapportages, overal toegankelijk.",
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

const BenefitsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
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
            Waarom ondernemers kiezen voor Declair
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