import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background"
        aria-hidden="true"
      />

      {/* Decorative elements */}
      <div
        className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="container-tight section-padding relative z-10 pt-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/10 mb-8 animate-fade-up delay-100"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <span className="text-sm font-medium text-secondary-foreground">
              Gratis starten, geen creditcard nodig
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6 animate-fade-up delay-200 text-balance"
          >
            Stuur je factuur.
            <br />
            <span className="text-primary">Word betaald.</span>
            <br />
            Declair.
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-up delay-300"
          >
            Factureren zonder gedoe voor zzp&apos;ers en eenmanszaken.
            Gemaakt om betaald te worden.
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-400"
          >
            <Button variant="default" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">
                Start gratis
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <ul
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in delay-600 list-none"
            aria-label="Voordelen"
          >
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Gratis beginnen</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Geen verborgen kosten</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Direct aan de slag</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Hero;
