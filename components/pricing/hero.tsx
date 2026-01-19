"use client";

import { motion } from "framer-motion";

const PricingHero = () => {
  return (
    <section className="relative pt-32 pb-8 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
      
      <div className="container-tight section-padding !py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6"
          >
            Simpel geprijsd.
            <br />
            <span className="text-primary">Gemaakt om betaald te worden.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto"
          >
            Geen contracten. Geen kleine lettertjes.
            <br />
            <span className="font-medium text-foreground">Opzeggen wanneer je wilt.</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default PricingHero;
