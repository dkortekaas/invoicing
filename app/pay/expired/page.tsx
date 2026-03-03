import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Mail } from "lucide-react"
import { getServerT } from "@/lib/i18n"
import { T } from "@/components/t"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT("payPage")
  return {
    title: t("expiredTitle"),
    description: t("expiredDescription"),
  }
}

export default async function ExpiredPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="container max-w-md py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl"><T ns="payPage" k="expiredCardTitle" /></CardTitle>
            <CardDescription>
              <T ns="payPage" k="expiredCardDesc" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span><T ns="payPage" k="expiredContact" /></span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <T ns="payPage" k="expiredHint" />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
