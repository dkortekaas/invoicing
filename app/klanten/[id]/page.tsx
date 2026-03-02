import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/customers/customer-form"
import { PortalLink } from "@/components/customers/portal-link"
import { getCustomer } from "../actions"
import { T } from "@/components/t"

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
        <h2 className="text-2xl font-bold tracking-tight"><T ns="customersPage" k="editTitle" /></h2>
        <p className="text-muted-foreground">
          <T ns="customersPage" k="editDescription" vars={{ name: customer.name }} />
        </p>
      </div>

      <CustomerForm customer={customerFormData} />

      <PortalLink
        customerId={customer.id}
        initialPortalUrl={
          customer.portalToken
            ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/klantportaal/${customer.portalToken}`
            : null
        }
      />
    </div>
  )
}
