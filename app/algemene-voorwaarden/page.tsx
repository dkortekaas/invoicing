import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Algemene Voorwaarden",
  description: "Algemene voorwaarden voor het gebruik van Declair.",
}

export default function AlgemeneVoorwaardenPage() {
  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 pt-28 pb-16 md:pt-36 md:pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Algemene Voorwaarden
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Laatst bijgewerkt: januari 2025
      </p>

      <div className="mt-10 space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Toepasselijkheid
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Deze algemene voorwaarden zijn van toepassing op alle
            overeenkomsten tussen Declair (Shortcheese Solutions) en de
            gebruiker van de facturatie- en administratiedienst. Door een
            account aan te maken ga je akkoord met deze voorwaarden.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. De dienst
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Declair biedt een online platform voor facturatie, klantbeheer,
            onkostenregistratie en gerelateerde administratie. De omvang
            van de dienst hangt af van het gekozen abonnement. We streven
            naar een hoge beschikbaarheid maar garanderen geen
            ononderbroken toegang.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. Account en gebruik
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Je bent verantwoordelijk voor het geheimhouden van je
            inloggegevens en voor alle handelingen die via je account
            plaatsvinden. Je gebruikt de dienst in overeenstemming met de
            wet en mag de dienst niet misbruiken of anderen hinderen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Betaling en opzegging
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Betaalde abonnementen lopen voor de afgesproken periode (maand
            of jaar) en worden automatisch verlengd tenzij je opzegt. Je
            kunt opzeggen via je account of door contact met ons op te
            nemen. Bij opzegging blijft je account actief tot het einde
            van de lopende betaalperiode.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Aansprakelijkheid
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We leveren de dienst &quot;zoals die is&quot;. Voor indirecte schade,
            gevolgschade of gederfde winst zijn we niet aansprakelijk,
            behalve bij opzet of grove schuld. Onze aansprakelijkheid is
            in alle gevallen beperkt tot het bedrag dat je in het
            desbetreffende jaar aan ons hebt betaald.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Wijzigingen
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We kunnen deze voorwaarden wijzigen. Belangrijke wijzigingen
            communiceren we per e-mail of via een melding in de applicatie.
            Door na de wijziging de dienst te blijven gebruiken ga je
            akkoord met de nieuwe voorwaarden.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Toepasselijk recht en contact
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Op deze voorwaarden is Nederlands recht van toepassing.
            Geschillen worden voorgelegd aan de bevoegde rechter in
            Nederland. Voor vragen over deze algemene voorwaarden kun je
            contact met ons opnemen.
          </p>
        </section>
      </div>
    </main>
  )
}
