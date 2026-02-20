/**
 * GET /api/signing/:token
 *
 * Publiek endpoint dat offerte-data retourneert voor de ondertekeningspagina.
 * Voert rate limiting en tokenvalidatie uit via validateSigningAccess.
 * Logt GEEN events — dat doet de page server component.
 */

import { type NextRequest, NextResponse } from "next/server"
import { validateSigningAccess, SIGNING_ERROR_MESSAGES } from "@/lib/quotes/signing-guard"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined

  const result = await validateSigningAccess(token, ip)

  if (!result.valid) {
    return NextResponse.json(
      { error: SIGNING_ERROR_MESSAGES[result.reason] },
      {
        status: result.httpStatus,
        headers: result.headers,
      },
    )
  }

  const { quote } = result

  // Geef alleen publieke velden terug — geen interne notities of handtekeningdata
  return NextResponse.json({
    quoteNumber: quote.quoteNumber,
    quoteDate: quote.quoteDate,
    expiryDate: quote.expiryDate,
    signingExpiresAt: quote.signingExpiresAt,
    status: quote.status,
    signingStatus: quote.signingStatus,
    currencyCode: quote.currencyCode,
    subtotal: Number(quote.subtotal),
    vatAmount: Number(quote.vatAmount),
    total: Number(quote.total),
    reference: quote.reference ?? null,
    notes: quote.notes ?? null,
    isSigned: quote.signingStatus === "SIGNED",
    isDeclined: quote.signingStatus === "DECLINED",
    signedAt: quote.signedAt ?? null,
    declinedAt: quote.declinedAt ?? null,
    customer: {
      name: quote.customer.name,
      companyName: quote.customer.companyName ?? null,
    },
    company: {
      name: quote.user.company?.name ?? null,
      logo: quote.user.company?.logo ?? null,
    },
    items: quote.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      unit: item.unit,
      subtotal: Number(item.subtotal),
      vatAmount: Number(item.vatAmount),
      total: Number(item.total),
      sortOrder: item.sortOrder,
    })),
  })
}
