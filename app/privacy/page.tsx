import type { Metadata } from "next"
import { getServerT } from "@/lib/i18n"
import { T } from "@/components/t"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("privacyPage")
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function PrivacyPage() {
  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 pt-28 pb-16 md:pt-36 md:pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        <T ns="privacyPage" k="title" />
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <T ns="privacyPage" k="lastUpdated" />
      </p>

      <div className="mt-10 space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            <T ns="privacyPage" k="section1Title" />
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <T ns="privacyPage" k="section1Content" />
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            <T ns="privacyPage" k="section2Title" />
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <T ns="privacyPage" k="section2Content" />
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            <T ns="privacyPage" k="section3Title" />
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <T ns="privacyPage" k="section3Content" />
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            <T ns="privacyPage" k="section4Title" />
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <T ns="privacyPage" k="section4Content" />
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            <T ns="privacyPage" k="section5Title" />
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <T ns="privacyPage" k="section5Content" />
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            <T ns="privacyPage" k="section6Title" />
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            <T ns="privacyPage" k="section6Content" />
          </p>
        </section>
      </div>
    </main>
  )
}
