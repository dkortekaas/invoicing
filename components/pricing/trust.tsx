"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileX, CalendarX, Shield, CreditCard } from "lucide-react";

const trustItems = [
  {
    icon: FileX,
    title: "Geen contract",
    description: "Gewoon maandelijks betalen",
  },
  {
    icon: CalendarX,
    title: "Maandelijks opzegbaar",
    description: "Stop wanneer je wilt",
  },
  {
    icon: Shield,
    title: "Prijzen exclusief btw",
    description: "Altijd transparant",
  },
  {
    icon: CreditCard,
    title: "Veilig via iDEAL",
    description: "Nederlandse betaling",
  },
];

const PricingTrust = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative">
      <div className="container-tight section-padding !py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Zonder zorgen starten
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="text-center p-6 rounded-xl bg-secondary/50"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingTrust;
