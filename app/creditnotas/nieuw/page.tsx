import { CreditNoteForm } from "@/components/creditnotes/credit-note-form"
import { getCustomersForDropdown } from "@/app/klanten/actions"
import { T } from "@/components/t"

export const dynamic = "force-dynamic"

export default async function NieuweCreditNotaPage() {
  const customers = await getCustomersForDropdown()

  const customersForForm = customers.map((c: typeof customers[0]) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight"><T ns="creditNotesPage" k="newCreditNoteTitle" /></h2>
        <p className="text-muted-foreground">
          <T ns="creditNotesPage" k="newCreditNoteDescription" />
        </p>
      </div>

      <CreditNoteForm customers={customersForForm} />
    </div>
  )
}
