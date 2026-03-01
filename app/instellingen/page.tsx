import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-session"
import { db } from "@/lib/db"
import { TabsContent } from "@/components/ui/tabs"
import { SettingsTabs } from "./settings-tabs"
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
import { SubscriptionSettings } from "./subscription-settings"
import { OndertekeningForm } from "./ondertekening-form"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { T } from "@/components/t"

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
  const [profile, companyInfo, financialInfo, emailSettings, mollieSettings, fiscalSettings, newsletterStatus, signingSettings, params] = await Promise.all([
    getProfile(),
    getCompanyInfo(),
    getFinancialInfo(),
    getEmailSettings(),
    getMollieSettings(),
    getFiscalSettings(),
    getNewsletterStatus(),
    db.userSigningSettings.findUnique({ where: { userId: user.id } }),
    searchParams,
  ])

  // Determine default tab from searchParams or default to "profiel"
  const defaultTab = params.tab || "profiel"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight"><T ns="settingsPage" k="title" /></h2>
        <p className="text-muted-foreground">
          <T ns="settingsPage" k="description" />
        </p>
      </div>

      <SettingsTabs defaultTab={defaultTab}>

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

        <TabsContent value="ondertekening" className="mt-6">
          <OndertekeningForm
            initialData={{
              defaultExpiryDays: signingSettings?.defaultExpiryDays ?? 14,
              autoCreateInvoice: signingSettings?.autoCreateInvoice ?? true,
              requireDrawnSignature: signingSettings?.requireDrawnSignature ?? false,
              agreementText: signingSettings?.agreementText,
              signingPageMessage: signingSettings?.signingPageMessage,
              logoUrl: signingSettings?.logoUrl,
              primaryColor: signingSettings?.primaryColor,
            }}
          />
        </TabsContent>

        <TabsContent value="abonnement" className="mt-6">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="import-export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle><T ns="settingsPage" k="importExportTitle" /></CardTitle>
              <CardDescription>
                <T ns="settingsPage" k="importExportDescription" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                <T ns="settingsPage" k="importExportIntro" />
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-1">
                <li><T ns="settingsPage" k="importExportItem1" /></li>
                <li><T ns="settingsPage" k="importExportItem2" /></li>
                <li><T ns="settingsPage" k="importExportItem3" /></li>
                <li><T ns="settingsPage" k="importExportItem4" /></li>
              </ul>
              <Button asChild>
                <Link href="/instellingen/import-export">
                  <T ns="settingsPage" k="toImportExport" />
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </SettingsTabs>
    </div>
  )
}
