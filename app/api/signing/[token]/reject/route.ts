/**
 * POST /api/signing/:token/reject
 *
 * Registreert het afwijzen van een offerte door de klant.
 *
 * Stappen:
 *   1. Rate limiting (10/uur per token, via validateSigningAccess)
 *   2. Tokenvalidatie + statuscontrole
 *   3. Request body validatie (Zod)
 *   4. Updaten quotestatus naar DECLINED + audittrail
 */

import { type NextRequest, NextResponse } from "next/server"
import { validateSigningAccess, SIGNING_ERROR_MESSAGES } from "@/lib/quotes/signing-guard"
import {
  rejectQuoteSchema,
  processRejectRequest,
  SigningError,
  signingErrorResponse,
} from "@/lib/quotes/signing-submission"

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

  const parsed = rejectQuoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validatiefout",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  // 4. Verwerk de afwijzing
  try {
    const result = await processRejectRequest(quote.id, parsed.data, {
      ipAddress: ip,
      userAgent,
    })

    return NextResponse.json(
      { success: true, declinedAt: result.declinedAt.toISOString() },
      { status: 200 },
    )
  } catch (err) {
    if (err instanceof SigningError) {
      const { status, message } = signingErrorResponse(err)
      return NextResponse.json({ error: message }, { status })
    }
    console.error("[POST /api/signing/reject] Unexpected error:", err)
    return NextResponse.json(
      { error: "Er is een onverwachte fout opgetreden. Probeer het opnieuw." },
      { status: 500 },
    )
  }
}
