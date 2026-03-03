import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Clock } from "lucide-react"
import { getServerT } from "@/lib/i18n"
import { T } from "@/components/t"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("payPage")
  return {
    title: t("pendingTitle"),
    description: t("pendingDescription"),
  }
}

export default async function PendingPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl"><T ns="payPage" k="pendingCardTitle" /></CardTitle>
            <CardDescription>
              <T ns="payPage" k="pendingCardDesc" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <T ns="payPage" k="pendingEmailConfirm" />
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <T ns="payPage" k="pendingCloseHint" />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
