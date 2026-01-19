"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, CreditCard, Bell, PieChart, Calculator, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Facturen maken in 1 minuut",
    description: "Vul je gegevens in, klik op verstuur. Klaar. Geen gedoe.",
  },
  {
    icon: CreditCard,
    title: "iDEAL-betaallink op elke factuur",
    description: "Je klant klikt, betaalt, jij krijgt je geld. Zo simpel is het.",
  },
  {
    icon: Bell,
    title: "Automatische betaalherinneringen",
    description: "Nooit meer achter klanten aan hoeven bellen. Wij doen het voor je.",
  },
  {
    icon: PieChart,
    title: "Overzicht van openstaande facturen",
    description: "Zie in één oogopslag wie nog moet betalen.",
  },
  {
    icon: Calculator,
    title: "Altijd correcte btw",
    description: "Automatische btw-berekening. Geen fouten, geen stress.",
  },
  {
    icon: Shield,
    title: "Veilig & betrouwbaar",
    description: "Je data is veilig bij ons. AVG-compliant en beveiligd.",
  },
];

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="relative">
      <div className="container-tight section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-lg text-muted-foreground">
            Geen overbodige functies. Alleen wat werkt voor jou.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group relative p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
