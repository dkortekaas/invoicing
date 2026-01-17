import { CustomerForm } from "@/components/customers/customer-form"

export default function NieuweKlantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nieuwe Klant</h2>
        <p className="text-muted-foreground">
          Voeg een nieuwe klant toe aan je klantenbestand
        </p>
      </div>

      <CustomerForm />
    </div>
  )
}
