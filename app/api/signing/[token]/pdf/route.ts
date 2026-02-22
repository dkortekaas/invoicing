/**
 * GET /api/signing/:token/pdf
 *
 * Genereert en retourneert de (getekende) offerte-PDF.
 * Toegankelijk via de publieke signing-token; werkt ook voor reeds
 * ondertekende offertes (voor klant om bewijs te downloaden).
 *
 * Logt een DOWNLOADED-event in de audittrail.
 */

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { rateLimit, RATE_LIMITS, retryAfterInfo } from "@/lib/rate-limit"
import { getQuoteBySigningToken } from "@/lib/quotes/signing-tokens"
import { generateSignedPdf } from "@/lib/quotes/generate-signed-pdf"
import { logPdfDownloaded } from "@/lib/quotes/signing-events"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined
  const userAgent = request.headers.get("user-agent") ?? undefined

  // Rate limiting (zelfde preset als signing-attempts)
  const rl = await rateLimit(`signing-pdf:${token}`, RATE_LIMITS.signing)
  if (!rl.allowed) {
    const { seconds } = retryAfterInfo(rl.resetAt)
    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      {
        status: 429,
        headers: { "Retry-After": String(seconds) },
      },
    )
  }

  // Token opzoeken — geen statusbeperking (ook SIGNED mag downloaden)
  const quote = await getQuoteBySigningToken(token)
  if (!quote) {
    return NextResponse.json(
      { error: "Onbekende ondertekeningslink." },
      { status: 404 },
    )
  }

  // Controleer of de offerte daadwerkelijk ondertekend is
  if (!quote.signature) {
    return NextResponse.json(
      { error: "De offerte is nog niet ondertekend." },
      { status: 409 },
    )
  }

  // PDF genereren
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateSignedPdf(quote.id)
  } catch (err) {
    console.error("[GET /api/signing/pdf] PDF generatie mislukt:", err)
    return NextResponse.json(
      { error: "PDF generatie mislukt. Probeer het opnieuw." },
      { status: 500 },
    )
  }

  // Audittrail — fire-and-forget
  logPdfDownloaded(quote.id, { ipAddress: ip, userAgent }).catch(() => {})

  // Best-effort touch voor updatedAt
  db.quote.update({ where: { id: quote.id }, data: { updatedAt: new Date() } })
    .catch(() => {})

  const filename = `Offerte-${quote.quoteNumber}-ondertekend.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
      "Cache-Control": "no-store",
    },
  })
}
