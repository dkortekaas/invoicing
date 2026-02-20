import { InvoiceForm } from "@/components/invoices/invoice-form"
import { getCustomersForDropdown } from "@/app/klanten/actions"
import { getActiveProducts } from "@/app/producten/actions"
import { getFiscalSettings } from "@/app/instellingen/actions"

export const dynamic = "force-dynamic"

export default async function NieuweFactuurPage() {
  const [customers, products, fiscalSettings] = await Promise.all([
    getCustomersForDropdown(),
    getActiveProducts(),
    getFiscalSettings(),
  ])

  // Transform data for form
  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
    paymentTermDays: c.paymentTermDays,
  }))

  const productsForForm = products.map((p: typeof products[0]) => ({
    id: p.id,
    name: p.name,
    unitPrice: p.unitPrice,
    vatRate: p.vatRate,
    unit: p.unit,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nieuwe Factuur</h2>
        <p className="text-muted-foreground">
          Maak een nieuwe factuur aan
        </p>
      </div>

      <InvoiceForm customers={customersForForm} products={productsForForm} useKOR={fiscalSettings.useKOR} />
    </div>
  )
}
