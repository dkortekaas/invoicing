import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-session"
import { db } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfielForm } from "./profiel-form"
import { BedrijfsgegevensForm } from "./bedrijfsgegevens-form"
import { FinancieleGegevensForm } from "./financiele-gegevens-form"
import { TwoFactorSetup } from "./2fa/two-factor-setup"
import { WachtwoordForm } from "./wachtwoord-form"
import { EmailSettingsForm } from "./email-form"
import { FiscaalForm } from "./fiscaal-form"
import { getProfile, getCompanyInfo, getFinancialInfo, getEmailSettings, getMollieSettings, getFiscalSettings, getNewsletterStatus } from "./actions"
import { NewsletterForm } from "./newsletter-form"
import { MollieSettingsForm } from "./mollie-settings-form"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

interface InstellingenPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function InstellingenPage({ searchParams }: InstellingenPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  })

  if (!dbUser) {
    redirect("/login")
  }

  // Fetch all data in parallel
  const [profile, companyInfo, financialInfo, emailSettings, mollieSettings, fiscalSettings, newsletterStatus, params] = await Promise.all([
    getProfile(),
    getCompanyInfo(),
    getFinancialInfo(),
    getEmailSettings(),
    getMollieSettings(),
    getFiscalSettings(),
    getNewsletterStatus(),
    searchParams,
  ])

  // Determine default tab from searchParams or default to "profiel"
  const defaultTab = params.tab || "profiel"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Instellingen</h2>
        <p className="text-muted-foreground">
          Beheer je profiel, bedrijfsgegevens en facturatie-instellingen
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="profiel">Profiel</TabsTrigger>
          <TabsTrigger value="beveiliging">Beveiliging</TabsTrigger>
          <TabsTrigger value="bedrijfsgegevens">Bedrijf</TabsTrigger>
          <TabsTrigger value="financiele-gegevens">Financieel</TabsTrigger>
          <TabsTrigger value="fiscaal">Fiscaal</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="betalingen">Betalingen</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="profiel" className="mt-6">
          <div className="space-y-6">
            <ProfielForm initialData={profile} />
            <NewsletterForm subscribed={newsletterStatus.subscribed} />
          </div>
        </TabsContent>

        <TabsContent value="bedrijfsgegevens" className="mt-6">
          <BedrijfsgegevensForm initialData={companyInfo} />
        </TabsContent>

        <TabsContent value="financiele-gegevens" className="mt-6">
          <FinancieleGegevensForm initialData={financialInfo} />
        </TabsContent>

        <TabsContent value="fiscaal" className="mt-6">
          <FiscaalForm initialData={fiscalSettings} />
        </TabsContent>

        <TabsContent value="beveiliging" className="mt-6">
          <div className="space-y-6">
            <WachtwoordForm />
            <TwoFactorSetup
              isEnabled={dbUser.twoFactorEnabled}
              hasSecret={!!dbUser.twoFactorSecret}
            />
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <EmailSettingsForm initialData={emailSettings} />
        </TabsContent>

        <TabsContent value="betalingen" className="mt-6">
          <MollieSettingsForm initialData={mollieSettings} />
        </TabsContent>

        <TabsContent value="import-export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import & Export</CardTitle>
              <CardDescription>
                Importeer en exporteer je klanten, facturen, producten, kosten en urenregistraties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gebruik de import/export tool om:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-1">
                <li>Gegevens te exporteren naar Excel of CSV</li>
                <li>Gegevens te importeren vanuit Excel of CSV</li>
                <li>Templates te downloaden met de juiste kolomnamen</li>
                <li>Je recente import taken te bekijken</li>
              </ul>
              <Button asChild>
                <Link href="/instellingen/import-export">
                  Naar Import & Export
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
