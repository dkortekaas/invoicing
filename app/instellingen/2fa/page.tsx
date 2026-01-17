import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-session"
import { db } from "@/lib/db"
import { TwoFactorSetup } from "./two-factor-setup"

export default async function TwoFactorPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  })

  if (!dbUser) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Twee-Factor Authenticatie</h2>
        <p className="text-muted-foreground">
          Beveilig je account met twee-factor authenticatie
        </p>
      </div>

      <TwoFactorSetup
        isEnabled={dbUser.twoFactorEnabled}
        hasSecret={!!dbUser.twoFactorSecret}
      />
    </div>
  )
}
