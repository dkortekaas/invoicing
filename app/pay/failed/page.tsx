import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import { getServerT } from "@/lib/i18n"
import { T } from "@/components/t"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("payPage")
  return {
    title: t("failedTitle"),
    description: t("failedDescription"),
  }
}

export default async function FailedPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl"><T ns="payPage" k="failedCardTitle" /></CardTitle>
            <CardDescription>
              <T ns="payPage" k="failedCardDesc" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <T ns="payPage" k="failedPossibleCauses" />
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li><T ns="payPage" k="failedCauseCancelled" /></li>
                <li><T ns="payPage" k="failedCauseInsufficient" /></li>
                <li><T ns="payPage" k="failedCauseTechnical" /></li>
                <li><T ns="payPage" k="failedCauseSession" /></li>
              </ul>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <T ns="payPage" k="failedRetryHint" />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
