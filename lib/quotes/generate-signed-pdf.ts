/**
 * Genereert een getekende offerte-PDF als Buffer.
 *
 * Haalt alle benodigde data op (offerte, klant, bedrijf, handtekening)
 * en rendert de SignedQuotePDF-template naar een PDF-buffer.
 */

import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/lib/db"
import { SignedQuotePDF, type SignedQuoteData } from "@/components/quotes/signed-quote-pdf-template"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

/**
 * Maakt een stabiele, beknopte document-ID op basis van de offerte-ID.
 * Formaat: DECL-YYYYMMDD-XXXXXXXX (8 hex-tekens van de cuid)
 */
function makeDocumentId(quoteId: string, signedAt: Date): string {
  const datePart = signedAt
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")
  const idPart = quoteId.replace(/-/g, "").slice(0, 8).toUpperCase()
  return `DECL-${datePart}-${idPart}`
}

export async function generateSignedPdf(quoteId: string): Promise<Buffer> {
  // Data ophalen
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      signature: true,
      user: {
        select: {
          company: true,
          vatNumber: true,
          kvkNumber: true,
          iban: true,
        },
      },
    },
  })

  if (!quote) throw new Error(`Offerte ${quoteId} niet gevonden`)
  if (!quote.signature) throw new Error(`Offerte ${quoteId} heeft geen handtekening`)

  const company = quote.user.company
  const sig = quote.signature

  const documentId = makeDocumentId(quoteId, sig.signedAt)
  // Verificatie-URL: de publieke ondertekeningspagina (toont "Ondertekend op...")
  const verificationUrl = quote.signingUrl ?? `${APP_URL}/sign/${quote.signingToken ?? quoteId}`

  const data: SignedQuoteData = {
    quoteNumber: quote.quoteNumber,
    quoteDate: quote.quoteDate,
    expiryDate: quote.expiryDate ?? null,
    reference: quote.reference ?? null,
    notes: quote.notes ?? null,
    subtotal: Number(quote.subtotal),
    vatAmount: Number(quote.vatAmount),
    total: Number(quote.total),
    items: quote.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      subtotal: Number(item.subtotal),
      total: Number(item.total),
    })),
    customer: {
      name: quote.customer.name,
      companyName: quote.customer.companyName ?? null,
      address: quote.customer.address ?? null,
      postalCode: quote.customer.postalCode ?? null,
      city: quote.customer.city ?? null,
      country: quote.customer.country ?? null,
      vatNumber: quote.customer.vatNumber ?? null,
      email: quote.customer.email ?? null,
    },
    company: {
      name: company?.name ?? "",
      address: company?.address ?? null,
      postalCode: company?.postalCode ?? null,
      city: company?.city ?? null,
      country: company?.country ?? null,
      email: company?.email ?? null,
      phone: company?.phone ?? null,
      logo: company?.logo ?? null,
      vatNumber: quote.user.vatNumber ?? null,
      kvkNumber: quote.user.kvkNumber ?? null,
      iban: quote.user.iban ?? null,
    },
    signature: {
      signerName: sig.signerName,
      signerRole: sig.signerRole ?? null,
      signerEmail: sig.signerEmail,
      signerIpAddress: sig.signerIpAddress ?? null,
      signatureMethod: sig.signatureMethod as "DRAWN" | "TYPED" | "UPLOADED",
      signatureData: sig.signatureData,
      signedAt: sig.signedAt,
      agreementText: sig.agreementText ?? null,
      remarks: sig.remarks ?? null,
      documentId,
      verificationUrl,
    },
  }

  // Call as function (not JSX) so renderToBuffer receives ReactElement<DocumentProps>
  const element = SignedQuotePDF({ quote: data })
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
