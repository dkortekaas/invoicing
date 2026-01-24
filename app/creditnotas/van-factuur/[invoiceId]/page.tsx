import { notFound } from "next/navigation"
import { CreditNoteForm } from "@/components/creditnotes/credit-note-form"
import { getCustomers } from "@/app/klanten/actions"
import { getInvoiceForCreditNote } from "../../actions"

export const dynamic = "force-dynamic"

interface VanFactuurPageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function VanFactuurPage({ params }: VanFactuurPageProps) {
  const { invoiceId } = await params
  const [invoice, customers] = await Promise.all([
    getInvoiceForCreditNote(invoiceId),
    getCustomers(),
  ])

  if (!invoice) {
    notFound()
  }

  // Transform data for form
  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
  }))

  // Create default items from invoice items
  const defaultItems = invoice.items.map((item: typeof invoice.items[0]) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
    unit: item.unit,
    originalInvoiceItemId: item.id,
  }))

  const preselectedInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Credit Nota voor {invoice.invoiceNumber}
        </h2>
        <p className="text-muted-foreground">
          Maak een credit nota aan voor factuur {invoice.invoiceNumber}
        </p>
        {invoice.creditedAmount > 0 && (
          <p className="text-sm text-amber-600 mt-2">
            Let op: Er is al {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(invoice.creditedAmount)} gecrediteerd voor deze factuur.
            Resterend bedrag: {new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(invoice.remainingAmount)}
          </p>
        )}
      </div>

      <CreditNoteForm
        customers={customersForForm}
        preselectedCustomerId={invoice.customerId}
        preselectedInvoice={preselectedInvoice}
        defaultItems={defaultItems}
      />
    </div>
  )
}
