import { QuoteForm } from "@/components/quotes/quote-form"
import { getCustomersForDropdown } from "@/app/klanten/actions"
import { getActiveProducts } from "@/app/producten/actions"
import { getFiscalSettings } from "@/app/instellingen/actions"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { T } from "@/components/t"

export const dynamic = "force-dynamic"

export default async function NieuweOffertePage() {
  const userId = await getCurrentUserId()

  const [customers, products, fiscalSettings, signingSettings] = await Promise.all([
    getCustomersForDropdown(),
    getActiveProducts(),
    getFiscalSettings(),
    db.userSigningSettings.findUnique({
      where: { userId },
      select: { defaultExpiryDays: true },
    }),
  ])

  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
    paymentTermDays: c.paymentTermDays,
  }))

  const productsForForm = products.map((p: typeof products[0]) => ({
    id: p.id,
    name: p.name,
    unitPrice: Number(p.unitPrice),
    vatRate: Number(p.vatRate),
    unit: p.unit,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight"><T ns="quotesPage" k="newQuoteTitle" /></h2>
        <p className="text-muted-foreground"><T ns="quotesPage" k="newQuoteDescription" /></p>
      </div>

      <QuoteForm
        customers={customersForForm}
        products={productsForForm}
        useKOR={fiscalSettings.useKOR}
        defaultExpiryDays={signingSettings?.defaultExpiryDays ?? 30}
      />
    </div>
  )
}
