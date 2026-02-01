import type { Metadata } from "next"
import { cookies } from "next/headers"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type Locale,
  LOCALE_COOKIE,
  defaultLocale,
  getMessages,
  createT,
} from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined) ?? defaultLocale
  const messages = getMessages(locale)
  const t = createT(messages, "cookiePolicy")
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function CookieBeleidPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined) ?? defaultLocale
  const messages = getMessages(locale)
  const t = createT(messages, "cookiePolicy")

  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 pt-28 pb-16 md:pt-36 md:pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("lastUpdated")}
      </p>

      <div className="mt-10 space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            {t("title1")}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description1")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            {t("title2")}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description2")}
          </p>

          <h3 className="text-lg font-semibold text-foreground mt-6">{t("title3")}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description3")}
          </p>

          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted/50">Cookie</TableHead>
                  <TableHead className="bg-muted/50">Doel</TableHead>
                  <TableHead className="bg-muted/50">Bewaartermijn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-sm"><code>session_id</code></TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">Houdt je ingelogde sessie bij</TableCell>
                  <TableCell className="text-muted-foreground">Sessie (tot je browser sluit)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm"><code>csrf_token</code></TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">Beveiligt formulieren tegen misbruik</TableCell>
                  <TableCell className="text-muted-foreground">Sessie</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm"><code>locale</code></TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">Onthoudt je taalvoorkeur (NL/EN)</TableCell>
                  <TableCell className="text-muted-foreground">1 jaar</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm"><code>cookie_consent</code></TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">Onthoudt je cookievoorkeuren</TableCell>
                  <TableCell className="text-muted-foreground">1 jaar</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">{t("title4")}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description4")}
          </p>
          
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted/50">Cookie</TableHead>
                  <TableHead className="bg-muted/50">Doel</TableHead>
                  <TableHead className="bg-muted/50">Bewaartermijn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-sm"><code>_ga</code></TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">Onderscheidt unieke bezoekers</TableCell>
                  <TableCell className="text-muted-foreground">2 jaar</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-sm"><code>_ga_*</code></TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">Bewaart sessiestatus</TableCell>
                  <TableCell className="text-muted-foreground">2 jaar</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p className="mt-3 leading-relaxed text-muted-foreground mt-6"><strong>Hoe we Google Analytics gebruiken:</strong></p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
            <li>IP-adressen worden geanonimiseerd</li>
            <li>We delen geen gegevens met Google voor advertentiedoeleinden</li>
            <li>We hebben een verwerkersovereenkomst met Google</li>
            <li>Gegevens worden verwerkt binnen de EU</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("title5")}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description5")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("title6")}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description6")}
          </p>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold text-foreground">{t("title7")}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description7")}
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
            <li><strong>Accepteer alle cookies</strong> – Noodzakelijke én analytische cookies</li>
            <li><strong>Alleen noodzakelijke cookies</strong> – Geen analytische cookies</li>
          </ul>
          <h3 className="text-lg font-semibold text-foreground mt-6">{t("title8")}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description8")}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground">{t("title9")}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description9")}
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/nl/kb/cookies-verwijderen-gegevens-wissen-websites-opgeslagen" target="_blank" rel="noopener">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/nl-nl/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
            <li><a href="https://support.microsoft.com/nl-nl/microsoft-edge/cookies-verwijderen-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a></li>
          </ul>

          <div className="mt-3 p-4 bg-muted rounded-md">
            <strong>{t("note")}:</strong> {t("description9a")}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("title10")}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description10")}
              Voor meer informatie over hoe wij omgaan met je gegevens, zie onze <a href="/privacy" className="text-primary underline">Privacyverklaring</a>.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description10a")}
          </p>

          <div className="mt-3 p-4 bg-muted rounded-md">
            <p><strong>{t("email")}:</strong> <a href="mailto:privacy@declair.app">privacy@declair.app</a></p>
            <p>&nbsp;</p>
            <p><strong>Shortcheese Solutions</strong></p>
            <p>Ballastwater 18</p>
            <p>3991 HL Houten</p>
            <p>KvK: 30220287</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">{t("title11")}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t("description11")}
          </p>
        </section>
      </div>
    </main>
  )
}
