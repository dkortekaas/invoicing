import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacybeleid van Declair – hoe we omgaan met je gegevens.",
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 pt-28 pb-16 md:pt-36 md:pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Laatst bijgewerkt: januari 2025
      </p>

      <div className="mt-10 space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Wie zijn wij?
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Declair is een dienst van Shortcheese Solutions. In dit
            privacybeleid leggen we uit welke persoonsgegevens we verzamelen,
            waarvoor we die gebruiken en wat je rechten zijn.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. Welke gegevens verzamelen we?
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We verwerken gegevens die je zelf aan ons verstrekt, zoals je
            e-mailadres en wachtwoord bij registratie, bedrijfsgegevens en
            gegevens van klanten die je in de applicatie invoert. Daarnaast
            verzamelen we technische gegevens zoals je IP-adres en
            gebruiksinformatie om de dienst te verbeteren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. Waarvoor gebruiken we je gegevens?
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We gebruiken je gegevens om de facturatie- en administratiedienst
            te leveren, om met je te communiceren, om de dienst te verbeteren
            en om te voldoen aan wettelijke verplichtingen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Bewaartermijn
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We bewaren je gegevens zolang je een account hebt en daarna
            alleen zo lang als de wet dat vereist (bijvoorbeeld voor de
            belastingaangifte).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Je rechten
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Je hebt het recht om je gegevens in te zien, te laten
            corrigeren of te laten verwijderen. Je kunt ook een klacht
            indienen bij de Autoriteit Persoonsgegevens. Neem voor
            uitoefening van je rechten contact met ons op.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Contact
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Voor vragen over dit privacybeleid kun je contact opnemen via
            de contactpagina of per e-mail.
          </p>
        </section>
      </div>
    </main>
  )
}
