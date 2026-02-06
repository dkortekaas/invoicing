"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  Receipt,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";
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

const FeaturesSection = () => {
  const { t } = useTranslations("featuresSection");
  
  const features = [
    {
      icon: FileText,
      title: t("featuresList.invoices.title"),
      description: t("featuresList.invoices.description"),
      href: "/functies/facturen-en-offertes",
    },
    {
      icon: CreditCard,
      title: t("featuresList.payments.title"),
      description: t("featuresList.payments.description"),
      href: "/functies/betalingen",
    },
    {
      icon: Receipt,
      title: t("featuresList.expenses.title"),
      description: t("featuresList.expenses.description"),
      href: "/functies/onkosten-en-bonnetjes",
    },
    {
      icon: Clock,
      title: t("featuresList.projects.title"),
      description: t("featuresList.projects.description"),
      href: "/functies/projecten-en-uren",
    },
    {
      icon: BarChart3,
      title: t("featuresList.reports.title"),
      description: t("featuresList.reports.description"),
      href: "/functies/rapportages-en-belasting",
    },
    // {
    //   icon: Plug,
    //   title: t("featuresList.integrations.title"),
    //   description: t("featuresList.integrations.description"),
    //   href: "/functies/koppelingen",
    // },
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
          <span className="text-primary font-medium">{t("title")}</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">
            {t("description")}
            <br />
            <span className="text-muted-foreground">{t("description2")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description3")}
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
                  {t("moreInfo")}
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