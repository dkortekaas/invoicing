import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { getCurrentUser } from "@/lib/get-session"
import { requireFeature } from "@/lib/auth/subscription-guard"
import { Button } from "@/components/ui/button"
import { AssetForm } from "@/components/assets/asset-form"

export default async function NieuwActivumPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  await requireFeature("tax_reporting")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/activa">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nieuw activum</h2>
          <p className="text-muted-foreground">
            Voeg een nieuw bedrijfsmiddel toe
          </p>
        </div>
      </div>

      <AssetForm />
    </div>
  )
}
