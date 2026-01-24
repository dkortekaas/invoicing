import { notFound, redirect } from "next/navigation"
import { CreditNoteForm } from "@/components/creditnotes/credit-note-form"
import { getCustomers } from "@/app/klanten/actions"
import { getCreditNote } from "../../actions"

export const dynamic = "force-dynamic"

interface BewerkenPageProps {
  params: Promise<{ id: string }>
}

export default async function BewerkenCreditNotaPage({ params }: BewerkenPageProps) {
  const { id } = await params
  const [creditNote, customers] = await Promise.all([
    getCreditNote(id),
    getCustomers(),
  ])

  if (!creditNote) {
    notFound()
  }

  // Only allow editing draft credit notes
  if (creditNote.status !== "DRAFT") {
    redirect(`/creditnotas/${id}`)
  }

  // Transform data for form
  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
  }))

  const creditNoteForForm = {
    id: creditNote.id,
    creditNoteNumber: creditNote.creditNoteNumber,
    customerId: creditNote.customerId,
    creditNoteDate: new Date(creditNote.creditNoteDate),
    reason: creditNote.reason as "PRICE_CORRECTION" | "QUANTITY_CORRECTION" | "RETURN" | "CANCELLATION" | "DISCOUNT_AFTER" | "VAT_CORRECTION" | "DUPLICATE_INVOICE" | "GOODWILL" | "OTHER",
    originalInvoiceId: creditNote.originalInvoiceId,
    originalInvoiceNumber: creditNote.originalInvoiceNumber,
    description: creditNote.description,
    notes: creditNote.notes,
    internalNotes: creditNote.internalNotes,
    items: creditNote.items.map((item: typeof creditNote.items[0]) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      unit: item.unit,
      originalInvoiceItemId: item.originalInvoiceItemId,
    })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Credit Nota {creditNote.creditNoteNumber} bewerken
        </h2>
        <p className="text-muted-foreground">
          Pas de credit nota aan
        </p>
      </div>

      <CreditNoteForm
        creditNote={creditNoteForForm}
        customers={customersForForm}
        preselectedCustomerId={creditNote.customerId}
      />
    </div>
  )
}
