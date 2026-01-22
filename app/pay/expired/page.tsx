import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Betaallink verlopen",
  description: "Deze betaallink is niet meer geldig",
}

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Betaallink verlopen</CardTitle>
            <CardDescription>
              Deze betaallink is niet meer geldig. Betaallinks zijn 30 dagen geldig.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Neem contact op met de verzender voor een nieuwe link</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                De leverancier kan een nieuwe betaallink genereren en naar je versturen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
