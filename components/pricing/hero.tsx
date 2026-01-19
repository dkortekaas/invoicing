const PricingHero = () => {
  return (
    <section className="relative pt-32 pb-8 overflow-hidden">
      {/* Subtle background */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background"
        aria-hidden="true"
      />

      <div className="container-tight section-padding !py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6 animate-fade-up text-balance">
            Simpel geprijsd.
            <br />
            <span className="text-primary">Gemaakt om betaald te worden.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto animate-fade-up delay-100">
            Geen contracten. Geen kleine lettertjes.
            <br />
            <span className="font-medium text-foreground">Opzeggen wanneer je wilt.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingHero;
