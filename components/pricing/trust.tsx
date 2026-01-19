import { FileX, CalendarX, Shield, CreditCard } from "lucide-react";

const trustItems = [
  {
    icon: FileX,
    title: "Geen contract",
    description: "Gewoon maandelijks betalen",
  },
  {
    icon: CalendarX,
    title: "Maandelijks opzegbaar",
    description: "Stop wanneer je wilt",
  },
  {
    icon: Shield,
    title: "Prijzen exclusief btw",
    description: "Altijd transparant",
  },
  {
    icon: CreditCard,
    title: "Veilig via iDEAL",
    description: "Nederlandse betaling",
  },
];

const PricingTrust = () => {
  return (
    <section className="relative" aria-labelledby="trust-title">
      <div className="container-tight section-padding !py-16">
        <h2 id="trust-title" className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
          Zonder zorgen starten
        </h2>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none" role="list">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            const delayClass = `delay-${(index + 1) * 100}`;

            return (
              <li
                key={item.title}
                className={`text-center p-6 rounded-xl bg-secondary/50 animate-fade-up ${delayClass}`}
              >
                <div
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default PricingTrust;
