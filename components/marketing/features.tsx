import { Zap, CreditCard, Bell, PieChart, Calculator, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Facturen maken in 1 minuut",
    description: "Vul je gegevens in, klik op verstuur. Klaar. Geen gedoe.",
  },
  {
    icon: CreditCard,
    title: "iDEAL-betaallink op elke factuur",
    description: "Je klant klikt, betaalt, jij krijgt je geld. Zo simpel is het.",
  },
  {
    icon: Bell,
    title: "Automatische betaalherinneringen",
    description: "Nooit meer achter klanten aan hoeven bellen. Wij doen het voor je.",
  },
  {
    icon: PieChart,
    title: "Overzicht van openstaande facturen",
    description: "Zie in één oogopslag wie nog moet betalen.",
  },
  {
    icon: Calculator,
    title: "Altijd correcte btw",
    description: "Automatische btw-berekening. Geen fouten, geen stress.",
  },
  {
    icon: Shield,
    title: "Veilig & betrouwbaar",
    description: "Je data is veilig bij ons. AVG-compliant en beveiligd.",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative" aria-labelledby="features-title">
      <div className="container-tight section-padding">
        <header className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Features
          </span>
          <h2 id="features-title" className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4 text-balance">
            Alles wat je nodig hebt
          </h2>
          <p className="text-lg text-muted-foreground">
            Geen overbodige functies. Alleen wat werkt voor jou.
          </p>
        </header>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none" role="list">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const delayClass = `delay-${(index + 1) * 100}`;

            return (
              <li
                key={feature.title}
                className={`group relative p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-up ${delayClass}`}
              >
                <div
                  className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors"
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default Features;
