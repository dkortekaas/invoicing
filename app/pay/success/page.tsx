import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Home, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Betaling geslaagd",
  description: "Je betaling is succesvol verwerkt",
}

interface SuccessPageProps {
  searchParams: Promise<{ already?: string }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const alreadyPaid = params.already === "true"

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">
              {alreadyPaid ? "Factuur al betaald" : "Betaling geslaagd!"}
            </CardTitle>
            <CardDescription>
              {alreadyPaid
                ? "Deze factuur was al eerder betaald."
                : "Je betaling is succesvol verwerkt. Je ontvangt een bevestiging per e-mail."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Bevestiging verzonden naar je e-mail</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Bedankt voor je betaling. Je kunt dit venster nu sluiten.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
