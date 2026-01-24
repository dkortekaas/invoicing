import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

type CompanyLike = {
  name?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
} | null

/**
 * Controleert of een bedrijfsrecord alle vereiste velden heeft.
 * Vereist: bedrijfsnaam, e-mail, adres, plaats, postcode.
 */
export function hasCompanyDetails(company: CompanyLike): boolean {
  return !!(
    company?.name?.trim() &&
    company?.email?.trim() &&
    company?.address?.trim() &&
    company?.city?.trim() &&
    company?.postalCode?.trim()
  )
}

/**
 * Server-side: redirect naar Instellingen > Bedrijfsgegevens als de ingelogde
 * gebruiker nog geen bedrijfsgegevens heeft. Gebruik in server actions voordat
 * klanten, facturen, producten, kosten of creditnota's worden aangemaakt.
 */
export async function requireCompanyDetails(): Promise<void> {
  const userId = await getCurrentUserId()
  const ok = await ensureCompanyDetails(userId)
  if (!ok) redirect("/instellingen?tab=bedrijfsgegevens")
}

/**
 * Controleert of de gebruiker bedrijfsgegevens heeft. Voor gebruik in API-routes
 * die een JSON-fout moeten teruggeven in plaats van een redirect.
 */
export async function ensureCompanyDetails(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      company: {
        select: {
          name: true,
          email: true,
          address: true,
          city: true,
          postalCode: true,
        },
      },
    },
  })
  return !!user && hasCompanyDetails(user.company)
}
