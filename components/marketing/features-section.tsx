"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  Receipt,
  Clock,
  BarChart3,
  Plug,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Facturen & Offertes",
    description:
      "Maak professionele facturen en offertes in seconden. Automatische omzetting, terugkerende facturen en credit nota's.",
    href: "/features/invoices",
  },
  {
    icon: CreditCard,
    title: "Sneller Betaald",
    description:
      "iDEAL betaallinks, automatische herinneringen en real-time notificaties. Gemiddeld 11 dagen sneller betaald.",
    href: "/features/payments",
  },
  {
    icon: Receipt,
    title: "Onkosten & Bonnetjes",
    description:
      "Scan bonnetjes met je telefoon. AI herkent bedragen, BTW en leveranciers automatisch.",
    href: "/features/expenses",
  },
  {
    icon: Clock,
    title: "Projecten & Uren",
    description:
      "Urenregistratie, projectbudgetten en winstgevendheid. Factureer direct vanuit je tijdregistratie.",
    href: "/features/projects",
  },
  {
    icon: BarChart3,
    title: "Rapportages & Belasting",
    description:
      "BTW-overzichten, inkomstenbelasting en cashflow voorspellingen. Alles klaar voor je aangifte.",
    href: "/features/reports",
  },
  {
    icon: Plug,
    title: "Koppelingen",
    description:
      "Sync met je boekhouder, bank en favoriete tools. Open API en webhooks voor eigen integraties.",
    href: "/features/integrations",
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

const FeaturesSection = () => {
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
          <span className="text-primary font-medium">Features</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">
            Alles wat je nodig hebt,
            <br />
            <span className="text-muted-foreground">niets wat je niet nodig hebt</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gebouwd door ondernemers, voor ondernemers. We weten hoe frustrerend
            administratie kan zijn.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Link
                href={feature.href}
                className="group block h-full p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Meer info
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;