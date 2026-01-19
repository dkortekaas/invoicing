const faqs = [
  {
    question: "Kan ik altijd opzeggen?",
    answer: "Ja.",
  },
  {
    question: "Komen er extra kosten bij?",
    answer: "Nee.",
  },
  {
    question: "Kan ik upgraden of downgraden?",
    answer: "Altijd.",
  },
  {
    question: "Moet ik mijn creditcard opgeven?",
    answer: "Nee, voor Starter niet. Betaal via iDEAL.",
  },
];

const PricingFAQ = () => {
  return (
    <section className="relative bg-muted/30" aria-labelledby="faq-title">
      <div className="container-tight section-padding">
        <header className="text-center mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            FAQ
          </span>
          <h2 id="faq-title" className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
            Veelgestelde vragen
          </h2>
        </header>

        <div className="max-w-2xl mx-auto">
          <dl className="space-y-4">
            {faqs.map((faq, index) => {
              const delayClass = `delay-${(index + 1) * 100}`;

              return (
                <div
                  key={faq.question}
                  className={`bg-background rounded-xl p-6 border border-border/50 animate-fade-up ${delayClass}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <dt className="font-semibold text-foreground">{faq.question}</dt>
                    <dd className="flex-shrink-0 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {faq.answer}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;
