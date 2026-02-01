'use client';

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  CreditCard,
  Receipt,
  Clock,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronRight,
  Mail,
  MessageSquare,
  BookOpen,
  Video,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";

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

const HelpPage = () => {
  const { t } = useTranslations("help");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: FileText,
      key: "invoices",
      href: "/help/facturen",
      articleCount: 12,
    },
    {
      icon: CreditCard,
      key: "payments",
      href: "/help/betalingen",
      articleCount: 8,
    },
    {
      icon: Receipt,
      key: "expenses",
      href: "/help/onkosten",
      articleCount: 10,
    },
    {
      icon: Clock,
      key: "time",
      href: "/help/urenregistratie",
      articleCount: 6,
    },
    {
      icon: BarChart3,
      key: "reports",
      href: "/help/rapportages",
      articleCount: 7,
    },
    {
      icon: Settings,
      key: "settings",
      href: "/help/instellingen",
      articleCount: 15,
    },
  ];

  const popularArticles = [
    { key: "article1", href: "/help/facturen/eerste-factuur" },
    { key: "article2", href: "/help/betalingen/ideal-instellen" },
    { key: "article3", href: "/help/onkosten/bonnetje-scannen" },
    { key: "article4", href: "/help/instellingen/bedrijfsgegevens" },
    { key: "article5", href: "/help/facturen/terugkerende-facturen" },
    { key: "article6", href: "/help/rapportages/btw-aangifte" },
  ];

  const faqItems = [
    { questionKey: "faq1Question", answerKey: "faq1Answer" },
    { questionKey: "faq2Question", answerKey: "faq2Answer" },
    { questionKey: "faq3Question", answerKey: "faq3Answer" },
    { questionKey: "faq4Question", answerKey: "faq4Answer" },
    { questionKey: "faq5Question", answerKey: "faq5Answer" },
    { questionKey: "faq6Question", answerKey: "faq6Answer" },
    { questionKey: "faq7Question", answerKey: "faq7Answer" },
    { questionKey: "faq8Question", answerKey: "faq8Answer" },
  ];

  const gettingStartedSteps = [
    { key: "step1", icon: "1" },
    { key: "step2", icon: "2" },
    { key: "step3", icon: "3" },
    { key: "step4", icon: "4" },
  ];

  return (
    <main id="main-content">
      {/* Hero Section with Search */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-gradient-hero relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container mx-auto px-6 md:px-0 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("description")}
            </p>

            {/* Search Box */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("searchHint")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("categoriesTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("categoriesDescription")}
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {categories.map((category) => (
              <motion.div key={category.key} variants={item}>
                <Link
                  href={category.href}
                  className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t(`categories.${category.key}.title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`categories.${category.key}.description`)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {category.articleCount} {t("articles")}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("gettingStartedTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("gettingStartedDescription")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {gettingStartedSteps.map((step, index) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-card border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t(`gettingStarted.${step.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`gettingStarted.${step.key}.description`)}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/help/aan-de-slag">
              <Button size="lg" variant="outline" className="gap-2">
                {t("viewFullGuide")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("popularArticlesTitle")}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {popularArticles.map((article, index) => (
              <motion.div
                key={article.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={article.href}
                  className="group flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <BookOpen className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground group-hover:text-primary transition-colors">
                    {t(`popularArticles.${article.key}`)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
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
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-card border border-border rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                    {t(faq.questionKey)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {t(faq.answerKey)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("contactTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("contactDescription")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-card border border-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("contactEmail.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("contactEmail.description")}
              </p>
              <a
                href="mailto:support@declair.nl"
                className="text-primary font-medium hover:underline"
              >
                support@declair.nl
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-card border border-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("contactChat.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("contactChat.description")}
              </p>
              <Button variant="outline" size="sm">
                {t("contactChat.button")}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-card border border-border text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("contactVideo.title")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("contactVideo.description")}
              </p>
              <Link href="/help/videos">
                <Button variant="outline" size="sm">
                  {t("contactVideo.button")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CallToActionSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        linkHref1="/register"
        linkText1={t("ctaButton1")}
        linkHref2="/contact"
        linkText2={t("ctaButton2")}
      />
    </main>
  );
};

export default HelpPage;
