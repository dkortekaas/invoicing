'use client';

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  FileText,
  CreditCard,
  Receipt,
  Clock,
  BarChart3,
  Plug,
  ArrowRight,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";
import CallToActionSection from "@/components/marketing/cta-section";

const featureConfig: Record<string, {
  icon: typeof FileText;
  translationKey: string;
  heroImage?: string;
  features: string[];
}> = {
  "facturen-en-offertes": {
    icon: FileText,
    translationKey: "invoices",
    heroImage: "/facturen-screenshot.png",
    features: [
      "feature1",
      "feature2",
      "feature3",
      "feature4",
      "feature5",
      "feature6",
    ],
  },
  "betalingen": {
    icon: CreditCard,
    translationKey: "payments",
    heroImage: "/betalingen-screenshot.png",
    features: [
      "feature1",
      "feature2",
      "feature3",
      "feature4",
      "feature5",
    ],
  },
  "onkosten-en-bonnetjes": {
    icon: Receipt,
    translationKey: "expenses",
    heroImage: "/onkosten-screenshot.png",
    features: [
      "feature1",
      "feature2",
      "feature3",
      "feature4",
      "feature5",
    ],
  },
  "projecten-en-uren": {
    icon: Clock,
    translationKey: "projects",
    heroImage: "/projecten-screenshot.png",
    features: [
      "feature1",
      "feature2",
      "feature3",
      "feature4",
      "feature5",
    ],
  },
  "rapportages-en-belasting": {
    icon: BarChart3,
    translationKey: "reports",
    heroImage: "/rapportages-screenshot.png",
    features: [
      "feature1",
      "feature2",
      "feature3",
      "feature4",
      "feature5",
    ],
  },
  "koppelingen": {
    icon: Plug,
    translationKey: "integrations",
    features: [
      "feature1",
      "feature2",
      "feature3",
      "feature4",
      "feature5",
    ],
  },
};

const FeatureDetailPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const { t } = useTranslations("featurePages");

  const config = featureConfig[slug];

  if (!config) {
    notFound();
  }

  const Icon = config.icon;
  const key = config.translationKey;

  return (
    <main id="main-content">
      {/* Hero Section */}
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
          <div className={`grid ${config.heroImage ? "lg:grid-cols-2 gap-12 lg:gap-16 items-center" : ""}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={config.heroImage ? "" : "max-w-3xl"}
            >
              <Link
                href="/functies"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToFeatures")}
              </Link>

              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {t(`${key}.title`)}
              </h1>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
                {t(`${key}.description`)}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2 shadow-glow">
                    {t("startFree")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/prijzen">
                  <Button variant="outline" size="lg">
                    {t("viewPricing")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {config.heroImage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative px-4 md:px-0"
              >
                {/* Browser Mockup */}
                <div className="relative bg-card rounded-xl shadow-xl border border-border overflow-hidden">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/60" />
                      <div className="w-3 h-3 rounded-full bg-warning/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground">
                        declair.nl
                      </div>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <Image
                    src={config.heroImage}
                    alt={t(`${key}.title`)}
                    width={800}
                    height={600}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t(`${key}.featuresTitle`)}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {config.features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t(`${key}.features.${feature}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${key}.features.${feature}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("howItWorks")}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: step * 0.15 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t(`${key}.steps.step${step}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${key}.steps.step${step}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Features */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("otherFeatures")}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.entries(featureConfig)
              .filter(([s]) => s !== slug)
              .slice(0, 3)
              .map(([featureSlug, featureData]) => {
                const FeatureIcon = featureData.icon;
                return (
                  <motion.div
                    key={featureSlug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href={`/functies/${featureSlug}`}
                      className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <FeatureIcon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t(`${featureData.translationKey}.title`)}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        {t("learnMore")}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CallToActionSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        linkHref1="/register"
        linkText1={t("ctaButton1")}
        linkHref2="/prijzen"
        linkText2={t("ctaButton2")}
        checkText1={t("ctaCheck1")}
        checkText2={t("ctaCheck2")}
        checkText3={t("ctaCheck3")}
      />
    </main>
  );
};

export default FeatureDetailPage;
