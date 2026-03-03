import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail } from "lucide-react"
import { getServerT } from "@/lib/i18n"
import { T } from "@/components/t"

interface SuccessPageProps {
  searchParams: Promise<{ already?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("payPage")
  return {
    title: t("successTitle"),
    description: t("successDescription"),
  }
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
              {alreadyPaid ? <T ns="payPage" k="alreadyPaidCardTitle" /> : <T ns="payPage" k="successCardTitle" />}
            </CardTitle>
            <CardDescription>
              {alreadyPaid ? <T ns="payPage" k="alreadyPaidCardDesc" /> : <T ns="payPage" k="successCardDesc" />}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span><T ns="payPage" k="successEmailSent" /></span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <T ns="payPage" k="successThankYou" />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
