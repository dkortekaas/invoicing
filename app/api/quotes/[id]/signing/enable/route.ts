/**
 * POST /api/quotes/:id/signing/enable
 *
 * Activeert digitale ondertekening voor een offerte en verstuurt de uitnodigingse-mail.
 *
 * Stappen:
 *   1. Authenticatie (getCurrentUserId)
 *   2. Request body validatie (Zod)
 *   3. Eigenaarschap offerte controleren
 *   4. Token + URL genereren
 *   5. Quote bijwerken (signingEnabled, token, url, expiresAt, autoCreateInvoice)
 *   6. Uitnodigingse-mail versturen
 */

import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"
import { generateSigningToken, generateSigningUrl } from "@/lib/quotes/signing-tokens"
import { sendSigningInvitationEmail } from "@/lib/email/send-quote-signing"

export const dynamic = "force-dynamic"

const enableSigningSchema = z.object({
  validityDays: z.number().int().min(1).max(365).default(14),
  autoCreateInvoice: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 1. Authenticatie
  let userId: string
  try {
    userId = await getCurrentUserId()
  } catch {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 })
  }

  // 2. Request body valideren
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 })
  }

  const parsed = enableSigningSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validatiefout", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // 3. Eigenaarschap controleren + offerte ophalen
  const quote = await db.quote.findUnique({
    where: { id, userId },
    select: {
      id: true,
      signingEnabled: true,
      customer: { select: { email: true } },
    },
  })

  if (!quote) {
    return NextResponse.json({ error: "Offerte niet gevonden" }, { status: 404 })
  }

  if (quote.signingEnabled) {
    return NextResponse.json(
      { error: "Ondertekening is al ingeschakeld voor deze offerte" },
      { status: 409 },
    )
  }

  if (!quote.customer.email) {
    return NextResponse.json(
      { error: "De klant heeft geen e-mailadres. Voeg een e-mailadres toe aan de klant." },
      { status: 422 },
    )
  }

  // 4. Token + URL genereren
  const token = generateSigningToken()
  const signingUrl = generateSigningUrl(token)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + parsed.data.validityDays)

  // 5. Quote bijwerken
  await db.quote.update({
    where: { id },
    data: {
      signingEnabled: true,
      signingToken: token,
      signingUrl,
      signingExpiresAt: expiresAt,
      autoCreateInvoice: parsed.data.autoCreateInvoice,
    },
  })

  // 6. Uitnodigingse-mail versturen (zet ook status → SENT + signingStatus → PENDING)
  try {
    await sendSigningInvitationEmail(id)
  } catch (err) {
    console.error("[signing/enable] Uitnodigingse-mail mislukt:", err)
    // Signing is ingeschakeld maar e-mail kon niet worden verstuurd
    return NextResponse.json(
      {
        success: true,
        signingUrl,
        warning:
          "Ondertekening geactiveerd, maar de uitnodigingse-mail kon niet worden verstuurd. Kopieer de link en stuur deze handmatig.",
      },
      { status: 200 },
    )
  }

  return NextResponse.json({ success: true, signingUrl })
}
