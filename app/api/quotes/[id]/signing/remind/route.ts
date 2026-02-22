/**
 * POST /api/quotes/:id/signing/remind
 *
 * Verstuurt handmatig een herinneringse-mail aan de klant voor het ondertekenen
 * van een offerte.
 *
 * Stappen:
 *   1. Authenticatie (getCurrentUserId)
 *   2. Eigenaarschap + signing-status controleren
 *   3. sendSigningReminderEmail aanroepen met reminderType: MANUAL
 *   4. QuoteSigningReminder record wordt aangemaakt in sendSigningReminderEmail
 *   5. REMINDER_SENT event wordt gelogd in QuoteSigningEvent
 */

import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"
import { sendSigningReminderEmail } from "@/lib/email/send-quote-signing"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
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

  // 2. Eigenaarschap + signing-status controleren
  const quote = await db.quote.findUnique({
    where: { id, userId },
    select: {
      id: true,
      signingEnabled: true,
      signingStatus: true,
      signingExpiresAt: true,
      customer: { select: { email: true } },
    },
  })

  if (!quote || !quote.signingEnabled) {
    return NextResponse.json(
      { error: "Offerte niet gevonden of ondertekening niet ingeschakeld" },
      { status: 404 },
    )
  }

  if (!quote.customer.email) {
    return NextResponse.json(
      { error: "De klant heeft geen e-mailadres" },
      { status: 422 },
    )
  }

  if (quote.signingStatus === "SIGNED") {
    return NextResponse.json(
      { error: "De offerte is al ondertekend — een herinnering is niet meer nodig" },
      { status: 409 },
    )
  }

  if (quote.signingStatus === "DECLINED") {
    return NextResponse.json(
      { error: "De offerte is afgewezen" },
      { status: 409 },
    )
  }

  if (
    quote.signingExpiresAt != null &&
    new Date() > quote.signingExpiresAt
  ) {
    return NextResponse.json(
      { error: "De ondertekeningslink is verlopen. Activeer ondertekening opnieuw." },
      { status: 410 },
    )
  }

  // 3. Herinnering versturen (met reminderType: MANUAL)
  try {
    await sendSigningReminderEmail(id, { reminderType: "MANUAL" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout"
    return NextResponse.json(
      { error: `Herinnering kon niet worden verstuurd: ${message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
