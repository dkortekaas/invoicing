import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="relative overflow-hidden" aria-labelledby="cta-title">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* Decorative circles */}
      <div
        className="absolute -top-32 -right-32 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="container-tight section-padding relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            id="cta-title"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6 animate-fade-up text-balance"
          >
            Klaar met wachten op je geld?
          </h2>

          <p className="text-lg text-primary-foreground/80 mb-10 animate-fade-up delay-100">
            Start vandaag nog met BetaalMe. Gratis en binnen een minuut aan de slag.
          </p>

          <div className="animate-fade-up delay-200">
            <Button
              size="xl"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              asChild
            >
              <Link href="/register">
                Start vandaag met BetaalMe
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/60 animate-fade-in delay-400">
            Geen creditcard nodig • Gratis starten • Direct aan de slag
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
