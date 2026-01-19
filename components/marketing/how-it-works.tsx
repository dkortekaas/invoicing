import { FileText, Send, Banknote } from "lucide-react";

const steps = [
  {
    step: "1",
    icon: FileText,
    title: "Maak je factuur",
    description: "Vul de gegevens in. In minder dan een minuut heb je een professionele factuur.",
  },
  {
    step: "2",
    icon: Send,
    title: "Verstuur 'm",
    description: "Met één klik verstuur je de factuur naar je klant. Inclusief iDEAL-betaallink.",
  },
  {
    step: "3",
    icon: Banknote,
    title: "Word betaald",
    description: "Je klant betaalt direct via iDEAL. Jij krijgt je geld op je rekening.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative bg-muted/30" aria-labelledby="how-it-works-title">
      <div className="container-tight section-padding">
        <header className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Hoe het werkt
          </span>
          <h2 id="how-it-works-title" className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4 text-balance">
            In 3 stappen betaald
          </h2>
          <p className="text-lg text-muted-foreground">
            Simpeler kan het niet. Echt niet.
          </p>
        </header>

        <div className="relative">
          {/* Connection line */}
          <div
            className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2"
            aria-hidden="true"
          />

          <ol className="grid lg:grid-cols-3 gap-8 lg:gap-12 list-none" role="list">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const delayClass = `delay-${(index + 1) * 100 + 100}`;

              return (
                <li
                  key={step.title}
                  className={`relative text-center animate-fade-up ${delayClass}`}
                >
                  {/* Step number */}
                  <div className="relative inline-flex mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
                      aria-hidden="true"
                    >
                      <Icon className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center shadow-md"
                      aria-hidden="true"
                    >
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">
                    <span className="sr-only">Stap {step.step}: </span>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
