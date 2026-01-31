"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
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

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
            Klaar om slimmer te factureren?
          </h2>
          <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Start vandaag nog met Declair en ontdek hoeveel tijd je kunt besparen
            op je administratie. 14 dagen gratis, geen creditcard nodig.
          </p>

          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 shadow-lg"
              >
                Start gratis proefperiode
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>14 dagen gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Geen creditcard nodig</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Opzeggen wanneer je wilt</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;