import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/customers/customer-form"
import { getCustomer } from "../actions"

export const dynamic = "force-dynamic"

interface KlantDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function KlantDetailPage({ params }: KlantDetailPageProps) {
  const { id } = await params

  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  // Transform Prisma customer to form data format
  const customerFormData = {
    id: customer.id,
    name: customer.name,
    companyName: customer.companyName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
    vatNumber: customer.vatNumber,
    paymentTermDays: customer.paymentTermDays,
    notes: customer.notes,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Klant bewerken</h2>
        <p className="text-muted-foreground">
          Wijzig de gegevens van {customer.name}
        </p>
      </div>

      <CustomerForm customer={customerFormData} />
    </div>
  )
}
