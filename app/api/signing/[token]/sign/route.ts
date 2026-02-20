/**
 * POST /api/signing/:token/sign
 *
 * Verwerkt een ondertekeningsinzending voor een offerte.
 *
 * Stappen:
 *   1. Rate limiting (10/uur per token, via validateSigningAccess)
 *   2. Tokenvalidatie + statuscontrole
 *   3. Request body validatie (Zod)
 *   4. Opslaan QuoteSignature + updaten quotestatus (atomische transactie)
 *   5. Audittrail loggen
 */

import { type NextRequest, NextResponse } from "next/server"
import { validateSigningAccess, SIGNING_ERROR_MESSAGES } from "@/lib/quotes/signing-guard"
import {
  signQuoteSchema,
  processSignRequest,
  SigningError,
  signingErrorResponse,
  DEFAULT_AGREEMENT_TEXT,
} from "@/lib/quotes/signing-submission"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined
  const userAgent = request.headers.get("user-agent") ?? undefined

  // 1 + 2. Rate limit + tokenvalidatie
  const guard = await validateSigningAccess(token, ip)
  if (!guard.valid) {
    return NextResponse.json(
      { error: SIGNING_ERROR_MESSAGES[guard.reason] },
      { status: guard.httpStatus, headers: guard.headers },
    )
  }

  const { quote } = guard

  // 3. Request body valideren
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Ongeldige aanvraag — controleer het aanvraagformaat." },
      { status: 400 },
    )
  }

  const parsed = signQuoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validatiefout",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  // 4. Haal de agreement-tekst op uit de gebruikersinstellingen
  const userSettings = await db.userSigningSettings.findUnique({
    where: { userId: quote.userId },
    select: { agreementText: true },
  })
  const agreementText = userSettings?.agreementText ?? DEFAULT_AGREEMENT_TEXT

  // 5. Verwerk de ondertekening
  try {
    const result = await processSignRequest(quote.id, parsed.data, {
      ipAddress: ip,
      userAgent,
      agreementText,
    })

    return NextResponse.json(
      { success: true, signedAt: result.signedAt.toISOString() },
      { status: 200 },
    )
  } catch (err) {
    if (err instanceof SigningError) {
      const { status, message } = signingErrorResponse(err)
      return NextResponse.json({ error: message }, { status })
    }
    console.error("[POST /api/signing/sign] Unexpected error:", err)
    return NextResponse.json(
      { error: "Er is een onverwachte fout opgetreden. Probeer het opnieuw." },
      { status: 500 },
    )
  }
}
