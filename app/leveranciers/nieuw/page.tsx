import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VendorForm } from "@/components/vendors/vendor-form"

export default function NieuweLeverancierPage() {
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
          <h2 className="text-2xl font-bold tracking-tight">Nieuwe Leverancier</h2>
          <p className="text-muted-foreground">
            Voeg een nieuwe leverancier toe voor automatische categorisatie
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leverancier gegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorForm />
        </CardContent>
      </Card>
    </div>
  )
}
