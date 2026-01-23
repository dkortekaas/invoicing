import { CreditNoteForm } from "@/components/creditnotes/credit-note-form"
import { getCustomers } from "@/app/klanten/actions"

export const dynamic = "force-dynamic"

export default async function NieuweCreditNotaPage() {
  const customers = await getCustomers()

  // Transform data for form
  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nieuwe Credit Nota</h2>
        <p className="text-muted-foreground">
          Maak een nieuwe credit nota aan
        </p>
      </div>

      <CreditNoteForm customers={customersForForm} />
    </div>
  )
}
