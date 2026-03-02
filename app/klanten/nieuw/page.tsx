import { CustomerForm } from "@/components/customers/customer-form"
import { T } from "@/components/t"

export default function NieuweKlantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight"><T ns="customersPage" k="newTitle" /></h2>
        <p className="text-muted-foreground">
          <T ns="customersPage" k="newDescription" />
        </p>
      </div>

      <CustomerForm />
    </div>
  )
}
