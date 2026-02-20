import { notFound, redirect } from "next/navigation"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { getInvoice } from "@/app/facturen/actions"
import { getCustomersForDropdown } from "@/app/klanten/actions"
import { getActiveProducts } from "@/app/producten/actions"
import { getFiscalSettings } from "@/app/instellingen/actions"

export const dynamic = "force-dynamic"

interface FactuurBewerkenPageProps {
  params: Promise<{ id: string }>
}

export default async function FactuurBewerkenPage({ params }: FactuurBewerkenPageProps) {
  const { id } = await params

  const [invoice, customers, products, fiscalSettings] = await Promise.all([
    getInvoice(id),
    getCustomersForDropdown(),
    getActiveProducts(),
    getFiscalSettings(),
  ])

  if (!invoice) {
    notFound()
  }

  // Paid invoices cannot be edited
  if (invoice.status === "PAID") {
    redirect(`/facturen/${id}`)
  }

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

  // Transform invoice for form
  const invoiceForForm = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    reference: invoice.reference || "",
    notes: invoice.notes || "",
    internalNotes: invoice.internalNotes || "",
    currencyCode: invoice.currencyCode || "EUR",
    items: invoice.items.map((item: typeof invoice.items[0]) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      unit: item.unit,
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Factuur {invoice.invoiceNumber} bewerken
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Wijzig de factuurgegevens
        </p>
      </div>

      <InvoiceForm
        invoice={invoiceForForm}
        customers={customersForForm}
        products={productsForForm}
        useKOR={fiscalSettings.useKOR}
      />
    </div>
  )
}
