import { notFound } from "next/navigation"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { getInvoice } from "@/app/facturen/actions"
import { getCustomers } from "@/app/klanten/actions"
import { getActiveProducts } from "@/app/producten/actions"

export const dynamic = "force-dynamic"

interface FactuurBewerkenPageProps {
  params: Promise<{ id: string }>
}

export default async function FactuurBewerkenPage({ params }: FactuurBewerkenPageProps) {
  const { id } = await params
  
  const [invoice, customers, products] = await Promise.all([
    getInvoice(id),
    getCustomers(),
    getActiveProducts(),
  ])

  if (!invoice) {
    notFound()
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
    unitPrice: p.unitPrice.toNumber(),
    vatRate: p.vatRate.toNumber(),
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
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      unit: item.unit,
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Factuur {invoice.invoiceNumber} bewerken
        </h2>
        <p className="text-muted-foreground">
          Wijzig de factuurgegevens
        </p>
      </div>

      <InvoiceForm
        invoice={invoiceForForm}
        customers={customersForForm}
        products={productsForForm}
      />
    </div>
  )
}
