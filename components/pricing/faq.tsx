"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const faqs = [
  {
    question: "Kan ik altijd opzeggen?",
    answer: "Ja.",
  },
  {
    question: "Komen er extra kosten bij?",
    answer: "Nee.",
  },
  {
    question: "Kan ik upgraden of downgraden?",
    answer: "Altijd.",
  },
  {
    question: "Moet ik mijn creditcard opgeven?",
    answer: "Nee, voor Starter niet. Betaal via iDEAL.",
  },
];

const PricingFAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative bg-muted/30">
      <div className="container-tight section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
            Veelgestelde vragen
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="bg-background rounded-xl p-6 border border-border/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  <span className="flex-shrink-0 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {faq.answer}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;
