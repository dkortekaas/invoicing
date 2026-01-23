import { Clock, FileWarning, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Te laat betalen",
    description: "Klanten die maar blijven wachten met betalen.",
  },
  {
    icon: FileWarning,
    title: "Gedoe met facturen",
    description: "Eindeloos klooien met Word en Excel.",
  },
  {
    icon: BarChart3,
    title: "Geen overzicht",
    description: "Wie heeft al betaald? Geen idee.",
  },
];

const solutions = [
  "Professionele facturen in seconden",
  "Automatische betaalherinneringen",
  "iDEAL-betaallink op elke factuur",
  "Altijd overzicht van je geld",
];

const ProblemSolution = () => {
  return (
    <section className="relative bg-muted/30" aria-labelledby="problem-solution-title">
      <div className="container-tight section-padding">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problems */}
          <div className="animate-slide-left">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Het probleem
            </span>
            <h2 id="problem-solution-title" className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-8">
              Herkenbaar?
            </h2>

            <ul className="space-y-6 list-none" role="list" aria-label="Veelvoorkomende problemen">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                const delayClass = `delay-${(index + 1) * 100}`;

                return (
                  <li
                    key={problem.title}
                    className={`flex items-start gap-4 p-4 rounded-xl bg-background border border-border/50 animate-fade-up ${delayClass}`}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{problem.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Solution */}
          <div className="relative animate-slide-right delay-200">
            <div
              className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl"
              aria-hidden="true"
            />
            <div className="relative bg-background border border-primary/20 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    De oplossing
                  </span>
                  <p className="text-2xl font-bold text-foreground">
                    Declair regelt het
                  </p>
                </div>
              </div>

              <ul className="space-y-4 list-none" role="list" aria-label="Onze oplossingen">
                {solutions.map((item, index) => {
                  const delayClass = `delay-${(index + 4) * 100}`;

                  return (
                    <li
                      key={item}
                      className={`flex items-center gap-3 animate-fade-up ${delayClass}`}
                    >
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                      <span className="text-foreground font-medium">{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
