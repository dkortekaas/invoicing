import { notFound } from "next/navigation"
import { CreditNoteForm } from "@/components/creditnotes/credit-note-form"
import { getCustomersForDropdown } from "@/app/klanten/actions"
import { getInvoiceForCreditNote } from "../../actions"
import { T } from "@/components/t"

export const dynamic = "force-dynamic"

interface VanFactuurPageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function VanFactuurPage({ params }: VanFactuurPageProps) {
  const { invoiceId } = await params
  const [invoice, customers] = await Promise.all([
    getInvoiceForCreditNote(invoiceId),
    getCustomersForDropdown(),
  ])

  if (!invoice) {
    notFound()
  }

  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
  }))

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

  const creditedAmount = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(invoice.creditedAmount)
  const remainingAmount = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(invoice.remainingAmount)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <T ns="creditNotesPage" k="fromInvoiceTitle" vars={{ number: invoice.invoiceNumber }} />
        </h2>
        <p className="text-muted-foreground">
          <T ns="creditNotesPage" k="fromInvoiceDescription" vars={{ number: invoice.invoiceNumber }} />
        </p>
        {invoice.creditedAmount > 0 && (
          <p className="text-sm text-amber-600 mt-2">
            <T ns="creditNotesPage" k="alreadyCreditedWarning" vars={{ amount: creditedAmount, remaining: remainingAmount }} />
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
