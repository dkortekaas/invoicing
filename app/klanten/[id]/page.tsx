import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/customers/customer-form"
import { getCustomer } from "../actions"

export const dynamic = "force-dynamic"

interface KlantDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function KlantDetailPage({ params }: KlantDetailPageProps) {
  const { id } = await params

  // In productie: haal klant op uit database
  // const customer = await getCustomer(id)

  // Placeholder data voor nu
  const customer = {
    id,
    name: "Jan Janssen",
    companyName: "Acme B.V.",
    email: "jan@acme.nl",
    phone: "06-12345678",
    address: "Kerkstraat 123",
    city: "Amsterdam",
    postalCode: "1012 AB",
    country: "Nederland",
    vatNumber: "NL123456789B01",
    paymentTermDays: 30,
    notes: "Belangrijke klant",
  }

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Klant bewerken</h2>
        <p className="text-muted-foreground">
          Wijzig de gegevens van {customer.name}
        </p>
      </div>

      <CustomerForm customer={customer} />
    </div>
  )
}
