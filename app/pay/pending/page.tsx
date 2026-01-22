import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Betaling in verwerking",
  description: "Je betaling wordt verwerkt",
}

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Betaling in verwerking</CardTitle>
            <CardDescription>
              Je betaling wordt verwerkt. Dit kan enkele minuten duren.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Je ontvangt een bevestiging per e-mail zodra de betaling is verwerkt.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Je kunt dit venster sluiten. De betaling wordt op de achtergrond verwerkt.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
