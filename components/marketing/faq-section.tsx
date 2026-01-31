"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Kan ik Declair gratis proberen?",
    answer:
      "Ja! Je krijgt 14 dagen gratis toegang tot alle Professional functies. Geen creditcard nodig. Na de proefperiode kies je zelf of en welk abonnement bij je past.",
  },
  {
    question: "Wat zijn de transactiekosten voor betalingen?",
    answer:
      "Declair rekent geen transactiekosten. Je betaalt alleen de kosten van de betaalprovider (Mollie): €0,29 per iDEAL transactie.",
  },
  {
    question: "Kan ik mijn data exporteren?",
    answer:
      "Ja, je kunt al je gegevens exporteren naar CSV of Excel. Je data is altijd van jou.",
  },
  {
    question: "Werkt Declair met mijn boekhouder?",
    answer:
      "Ja! Declair koppelt met populaire boekhoudpakketten zoals Moneybird, Exact Online, e-Boekhouden en Yuki. Je boekhouder kan ook een eigen inlog krijgen.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 px-6 md:px-0 md:py-28 bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Veelgestelde vragen
          </h2>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
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

          <div className="text-center mt-8">
            <Link
              href="/help"
              className="text-primary hover:underline font-medium"
            >
              Bekijk alle veelgestelde vragen →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;