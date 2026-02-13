'use client';

import { Fragment, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";

const Pricing = () => {
  const { t } = useTranslations("pricing");
  const [isYearly, setIsYearly] = useState(false);

  const pricingFaqs = [
    { question: t("question1"), answer: t("answer1") },
    { question: t("question2"), answer: t("answer2") },
    { question: t("question3"), answer: t("answer3") },
    { question: t("question4"), answer: t("answer4") },
    { question: t("question5"), answer: t("answer5") },
    { question: t("question6"), answer: t("answer6") },
  ];

  const featureCategories = [
    {
      name: t("facturation"),
      features: [
        { name: t("invoicesPerMonth"), free: "5", starter: t("unlimited"), professional: t("unlimited"), business: t("unlimited") },
        { name: t("quotes"), free: true, starter: true, professional: true, business: true },
        { name: t("creditNotes"), free: false, starter: true, professional: true, business: true },
        { name: t("recurringInvoices"), free: false, starter: true, professional: true, business: true },
        { name: t("watermark"), free: true, starter: false, professional: false, business: false },
        { name: t("customBranding"), free: false, starter: true, professional: true, business: true },
        { name: t("multipleTemplates"), free: false, starter: false, professional: true, business: true },
        { name: t("digitalSigning"), free: false, starter: false, professional: true, business: true },
      ],
    },
    {
      name: t("payments"),
      features: [
        { name: t("idealPaymentLinks"), free: false, starter: false, professional: true, business: true },
        { name: t("creditCardPayments"), free: false, starter: false, professional: true, business: true },
        { name: t("automaticReminders"), free: false, starter: false, professional: true, business: true },
        { name: t("smartReminders"), free: false, starter: false, professional: true, business: true },
        { name: t("customerPortal"), free: false, starter: false, professional: false, business: true },
      ],
    },
    {
      name: t("expensesAndAdministration"),
      features: [
        { name: t("trackExpenses"), free: false, starter: true, professional: true, business: true },
        { name: t("ocrReceipts"), free: false, starter: true, professional: true, business: true },
        { name: t("mileageRegistration"), free: false, starter: false, professional: true, business: true },
        { name: t("categoriesManagement"), free: false, starter: true, professional: true, business: true },
      ],
    },
    {
      name: t("projectsAndTime"),
      features: [
        { name: t("createProjects"), free: false, starter: false, professional: true, business: true },
        { name: t("timeRegistration"), free: false, starter: false, professional: true, business: true },
        { name: t("invoicingFromHours"), free: false, starter: false, professional: true, business: true },
        { name: t("budgetMonitoring"), free: false, starter: false, professional: false, business: true },
      ],
    },
    {
      name: t("reportsAndTax"),
      features: [
        { name: t("vatSummaries"), free: false, starter: true, professional: true, business: true },
        { name: t("incomeTaxSummary"), free: false, starter: false, professional: true, business: true },
        { name: t("cashflowForecasting"), free: false, starter: false, professional: false, business: true },
        { name: t("exportToExcelCsv"), free: false, starter: true, professional: true, business: true },
      ],
    },
    {
      name: t("integrationsAndExtra"),
      features: [
        { name: t("bookkeepingIntegrations"), free: false, starter: false, professional: true, business: true },
        { name: t("multiCurrency"), free: false, starter: false, professional: false, business: true },
        { name: t("multiUser"), free: false, starter: false, professional: false, business: true },
        { name: t("contractManagement"), free: false, starter: false, professional: false, business: true },
        { name: t("apiAccess"), free: false, starter: false, professional: false, business: true },
        { name: "Webhooks", free: false, starter: false, professional: false, business: true },
      ],
    },
    {
      name: t("support"),
      features: [
        { name: t("emailSupport"), free: true, starter: true, professional: true, business: true },
        { name: t("prioritySupport"), free: false, starter: false, professional: true, business: true },
        { name: t("dedicatedAccountManager"), free: false, starter: false, professional: false, business: true },
      ],
    },
  ];

  const plans = [
    {
      name: t("free"),
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: t("freeDescription"),
      popular: false,
    },
    {
      name: t("starter"),
      monthlyPrice: 9.95,
      yearlyPrice: 8.25,
      description: t("starterDescription"),
      popular: false,
    },
    {
      name: t("professional"),
      monthlyPrice: 19.95,
      yearlyPrice: 16.58,
      description: t("professionalDescription"),
      popular: true,
    },
    {
      name: t("business"),
      monthlyPrice: 34.95,
      yearlyPrice: 29.08,
      description: t("businessDescription"),
      popular: false,
    },
  ];

  const yearlyTotals: Record<string, number> = {
    [t("free")]: 0,
    [t("starter")]: 99,
    [t("professional")]: 199,
    [t("business")]: 349,
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-foreground font-medium">{value}</span>;
    }
    return value ? (
      <Check className="w-5 h-5 text-success mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
    );
  };

  return (
      <main id="main-content">
        {/* Hero Section */}
        <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-gradient-hero">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {t("title")}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("description")}
              </p>

              {/* Billing Toggle */}
              <div className="mt-8 inline-flex items-center gap-4 bg-muted/50 rounded-full p-1.5">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !isYearly
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("monthly")}
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    isYearly
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("yearly")}
                  <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                    {t("2monthsfree")}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular
                      ? "bg-foreground text-background border-2 border-foreground shadow-xl lg:scale-105"
                      : "bg-card border border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      {t("mostpopular")}
                    </div>
                  )}
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        plan.popular ? "text-background" : "text-foreground"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        plan.popular ? "text-background/70" : "text-muted-foreground"
                      }`}
                    >
                      {plan.description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-bold ${
                          plan.popular ? "text-background" : "text-foreground"
                        }`}
                      >
                        {plan.monthlyPrice === 0
                          ? "€0"
                          : `€${isYearly ? plan.yearlyPrice.toFixed(2).replace(".", ",") : plan.monthlyPrice.toFixed(2).replace(".", ",")}`}
                      </span>
                      <span
                        className={
                          plan.popular ? "text-background/70" : "text-muted-foreground"
                        }
                      >
                        {plan.monthlyPrice === 0 ? "" : t("perMonth")}
                      </span>
                    </div>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <p
                        className={`text-sm mt-1 ${
                          plan.popular ? "text-background/70" : "text-muted-foreground"
                        }`}
                      >
                        {t("yearlyInvoiced")} (€{yearlyTotals[plan.name]?.toFixed(2).replace(".", ",")}/{t("yearly")})
                      </p>
                    )}
                    {plan.monthlyPrice > 0 && (
                      <p
                        className={`text-xs mt-1 ${
                          plan.popular ? "text-background/50" : "text-muted-foreground"
                        }`}
                      >
                        {t("exclVAT")}
                      </p>
                    )}
                  </div>

                  <Link href="/register" className="block mt-8">
                    <Button
                      variant={plan.popular ? "secondary" : "outline"}
                      className="w-full gap-2"
                    >
                      {plan.monthlyPrice === 0 ? t("startFree") : t("startFree")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t("compareFeatures")}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto overflow-x-auto"
            >
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">
                      {t("feature")}
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-28">
                      {t("free")}
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-28">
                      {t("starter")}
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-28 bg-primary/5">
                      {t("professional")}
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground w-28">
                      {t("business")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((category) => (
                    <Fragment key={category.name}>
                      <tr className="bg-muted/50">
                        <td
                          colSpan={5}
                          className="py-3 px-4 font-semibold text-foreground text-sm"
                        >
                          {category.name}
                        </td>
                      </tr>
                      {category.features.map((feature, index) => (
                        <tr
                          key={`${category.name}-${index}`}
                          className="border-b border-border/50"
                        >
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {feature.name}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {renderFeatureValue(feature.free)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {renderFeatureValue(feature.starter)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm bg-primary/5">
                            {renderFeatureValue(feature.professional)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {renderFeatureValue(feature.business)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {t("faqTitle")}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="max-w-3xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-4">
                {pricingFaqs.map((faq, index) => (
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
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <CallToActionSection
          title={t("notSureWhichPlan")}
          description={t("startFreeTrialDescription")}
          linkHref1="/register"
          linkText1={t("startFreeTrial")}
          linkHref2="/contact"
          linkText2={t("contactUs")}
          />

      </main>
  );
};

export default Pricing;
