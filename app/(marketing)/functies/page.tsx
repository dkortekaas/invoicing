'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  Receipt,
  Clock,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";
import { featureSlugMap } from "@/lib/i18n-routes";

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

const featureItemsNl = [
  { icon: FileText, titleKey: "invoices", nlSlug: "facturen-en-offertes", highlights: ["invoicesHighlight1", "invoicesHighlight2", "invoicesHighlight3"] },
  { icon: CreditCard, titleKey: "payments", nlSlug: "betalingen", highlights: ["paymentsHighlight1", "paymentsHighlight2", "paymentsHighlight3"] },
  { icon: Receipt, titleKey: "expenses", nlSlug: "onkosten-en-bonnetjes", highlights: ["expensesHighlight1", "expensesHighlight2", "expensesHighlight3"] },
  { icon: Clock, titleKey: "projects", nlSlug: "projecten-en-uren", highlights: ["projectsHighlight1", "projectsHighlight2", "projectsHighlight3"] },
  { icon: BarChart3, titleKey: "reports", nlSlug: "rapportages-en-belasting", highlights: ["reportsHighlight1", "reportsHighlight2", "reportsHighlight3"] },
];

const FeaturesPage = () => {
  const { t, locale, lp } = useTranslations("featuresPage");

  const features = featureItemsNl.map((f) => {
    const enSlug = featureSlugMap[f.nlSlug] ?? f.nlSlug;
    return {
      ...f,
      href: locale === "nl" ? `/functies/${f.nlSlug}` : `/en/functions/${enSlug}`,
    };
  });

  return (
    <main id="main-content">
      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-gradient-hero">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-medium">{t("subtitle")}</span>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold text-foreground">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature) => (
              <motion.div key={feature.titleKey} variants={item}>
                <Link
                  href={feature.href}
                  className="group block h-full p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t(`features.${feature.titleKey}.title`)}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t(`features.${feature.titleKey}.description`)}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span>{t(`features.${feature.titleKey}.${highlight}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    {t("learnMore")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* All Features List */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("allFeaturesTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("allFeaturesDescription")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {[
              "unlimitedInvoices",
              "quotes",
              "creditNotes",
              "recurringInvoices",
              "idealPayments",
              "creditCardPayments",
              "automaticReminders",
              "ocrScanning",
              "expenseTracking",
              "mileageTracking",
              "timeTracking",
              "projectManagement",
              "vatReports",
              "incomeTaxReports",
              "exportExcel",
              "bookkeepingIntegrations",
            ].map((featureKey) => (
              <div
                key={featureKey}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
              >
                <Check className="w-5 h-5 text-success shrink-0" />
                <span className="text-sm text-foreground">{t(`allFeatures.${featureKey}`)}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href={lp("/prijzen")}>
              <Button size="lg" className="gap-2">
                {t("viewPricing")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <CallToActionSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        linkHref1="/register"
        linkText1={t("ctaButton1")}
        linkHref2={lp("/prijzen")}
        linkText2={t("ctaButton2")}
        checkText1={t("ctaCheck1")}
        checkText2={t("ctaCheck2")}
        checkText3={t("ctaCheck3")}
      />
    </main>
  );
};

export default FeaturesPage;
