"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  title?: string;
  description?: string;
  linkHref1?: string;
  linkText1?: string;
  linkHref2?: string;
  linkText2?: string;
  checkText1?: string;
  checkText2?: string;
  checkText3?: string;
}

const CTASection = ({ title = "", description = "", linkHref1 = "", linkText1 = "", linkHref2 = "", linkText2 = "", checkText1 = "", checkText2 = "", checkText3 = "" }: CTASectionProps) => {
  return (
    <section className="py-20 px-6 md:px-0 md:py-28 bg-gradient-cta relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
            {title}
          </h2>
          <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
            {description}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {linkHref1 && linkText1 && (
            <Link href={linkHref1}>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 shadow-lg"
              >
                {linkText1}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}

          {linkHref2 && linkText2 && (
            <Link href={linkHref2}>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {linkText2}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          </div>

        {checkText1 && checkText2 && checkText3 ? (
          <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{checkText1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{checkText2}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{checkText3}</span>
            </div>
          </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;