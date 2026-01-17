import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-session"
import { db } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfielForm } from "./profiel-form"
import { BedrijfsgegevensForm } from "./bedrijfsgegevens-form"
import { FinancieleGegevensForm } from "./financiele-gegevens-form"
import { TwoFactorSetup } from "./2fa/two-factor-setup"
import { WachtwoordForm } from "./wachtwoord-form"
import { getProfile, getCompanyInfo, getFinancialInfo } from "./actions"

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
  const [profile, companyInfo, financialInfo, params] = await Promise.all([
    getProfile(),
    getCompanyInfo(),
    getFinancialInfo(),
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiel">Profiel</TabsTrigger>
          <TabsTrigger value="beveiliging">Beveiliging</TabsTrigger>
          <TabsTrigger value="bedrijfsgegevens">Bedrijfsgegevens</TabsTrigger>
          <TabsTrigger value="financiele-gegevens">Financiële gegevens</TabsTrigger>
        </TabsList>

        <TabsContent value="profiel" className="mt-6">
          <ProfielForm initialData={profile} />
        </TabsContent>

        <TabsContent value="bedrijfsgegevens" className="mt-6">
          <BedrijfsgegevensForm initialData={companyInfo} />
        </TabsContent>

        <TabsContent value="financiele-gegevens" className="mt-6">
          <FinancieleGegevensForm initialData={financialInfo} />
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
      </Tabs>
    </div>
  )
}
