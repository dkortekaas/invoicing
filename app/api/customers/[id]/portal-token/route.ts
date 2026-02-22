/**
 * POST /api/customers/:id/portal-token
 *
 * Genereert (of hergebruikt) een veilig klantportaaltoken voor de opgegeven klant.
 * Het token geeft de klant toegang tot /klantportaal/[token] waar ze hun offertes
 * kunnen bekijken en ondertekenen.
 *
 * Retourneert: { portalToken, portalUrl }
 */

import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let userId: string
  try {
    userId = await getCurrentUserId()
  } catch {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  const { id } = await params

  const customer = await db.customer.findUnique({
    where: { id, userId },
    select: { id: true, portalToken: true },
  })

  if (!customer) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 })
  }

  // Hergebruik bestaand token of genereer een nieuw veilig token
  const token = customer.portalToken ?? randomBytes(32).toString("hex")

  if (!customer.portalToken) {
    await db.customer.update({
      where: { id },
      data: { portalToken: token },
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const portalUrl = `${baseUrl}/klantportaal/${token}`

  return NextResponse.json({ portalToken: token, portalUrl })
}
