import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Betaling mislukt",
  description: "Je betaling kon niet worden verwerkt",
}

export default function FailedPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">Betaling mislukt</CardTitle>
            <CardDescription>
              Je betaling kon niet worden verwerkt. Dit kan verschillende oorzaken hebben.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Mogelijke oorzaken:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>De betaling is geannuleerd</li>
                <li>Onvoldoende saldo</li>
                <li>Technische storing bij de bank</li>
                <li>Sessie verlopen</li>
              </ul>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Je kunt het opnieuw proberen via de originele betaallink.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
