import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VendorForm } from "@/components/vendors/vendor-form"
import { getVendor } from "../actions"

interface EditLeverancierPageProps {
  params: Promise<{ id: string }>
}

export default async function EditLeverancierPage({ params }: EditLeverancierPageProps) {
  const { id } = await params
  const vendor = await getVendor(id)

  if (!vendor) {
    notFound()
  }

  // Check if this is a global vendor (user can only view, not edit)
  const isGlobalVendor = vendor.userId === null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leveranciers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isGlobalVendor ? 'Leverancier bekijken' : 'Leverancier bewerken'}
          </h2>
          <p className="text-muted-foreground">
            {isGlobalVendor
              ? 'Dit is een standaard leverancier die niet bewerkt kan worden'
              : 'Pas de gegevens van deze leverancier aan'
            }
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leverancier gegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorForm
            vendor={{
              id: vendor.id,
              name: vendor.name,
              aliases: vendor.aliases,
              defaultCategory: vendor.defaultCategory,
              website: vendor.website,
              vatNumber: vendor.vatNumber,
            }}
            readOnly={isGlobalVendor}
          />
        </CardContent>
      </Card>
    </div>
  )
}
