"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";

const HeroSection = () => {
  const { t } = useTranslations("heroSection");
  
  return (
    <section className="relative pt-28 pb-20 px-6 md:px-0 md:pt-36 md:pb-28 overflow-hidden bg-gradient-hero">
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

      <div className="container mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t("badge")}
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {t("heading")}
              <br />
              <span className="text-gradient">{t("heading2")}</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {t("subheading")}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-glow">
                  {t("cta1")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {t("cta2")}
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>{t("trustIndicator1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>{t("trustIndicator2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>{t("trustIndicator3")}</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Hero Visual */}
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
                    {t("appName")}
                  </div>
                </div>
              </div>

              {/* App Screenshot Placeholder */}
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-50 to-primary-100 p-6 flex items-center justify-center">
                <div className="w-full max-w-sm space-y-4">
                  {/* Fake Invoice */}
                  <div className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-3 w-24 bg-foreground/20 rounded" />
                        <div className="h-2 w-16 bg-foreground/10 rounded mt-2" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Totaal</div>
                        <div className="text-lg font-bold text-foreground">€2.450,00</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                        {t("paid")}
                      </div>
                      <div className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        {t("ideal")}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card rounded-lg shadow-sm border border-border p-3">
                      <div className="text-xs text-muted-foreground">{t("monthlyRevenue")}</div>
                      <div className="text-xl font-bold text-foreground">€8.650</div>
                    </div>
                    <div className="bg-card rounded-lg shadow-sm border border-border p-3">
                      <div className="text-xs text-muted-foreground">{t("outstanding")}</div>
                      <div className="text-xl font-bold text-foreground">€1.200</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Notification Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -right-4 top-1/4 animate-float"
            >
              <div className="bg-card rounded-lg shadow-lg border border-border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t("invoicePaid")}</div>
                  <div className="text-xs text-muted-foreground">{t("invoicePaidAmount")}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -left-4 bottom-1/4 animate-float-delayed"
            >
              <div className="bg-card rounded-lg shadow-lg border border-border p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t("receiptScanned")}</div>
                  <div className="text-xs text-muted-foreground">{t("receiptScannedAmount")}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;