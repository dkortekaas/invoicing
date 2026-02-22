/**
 * Automatische factuur aanmaak na ondertekening.
 *
 * Wanneer een offerte wordt ondertekend en autoCreateInvoice=true is ingesteld,
 * wordt er automatisch een conceptfactuur aangemaakt op basis van de offertegegevens.
 *
 * - Kopieert alle regelitems, bedragen en valuta van de offerte
 * - Factuurstatus: DRAFT (de gebruiker kan de factuur nog aanpassen)
 * - Vervaldatum: 30 dagen na vandaag (standaard betalingstermijn)
 * - Idempotent: als al een factuur is aangemaakt, wordt null teruggegeven
 */

import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { generateInvoiceNumber } from "@/lib/utils"
import { logInvoiceCreated } from "./signing-events"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Berekent het volgende factuurnummer voor een specifieke gebruiker.
 * Variant van getNextInvoiceNumber() uit facturen/actions.ts die userId
 * als parameter accepteert in plaats van getCurrentUserId() aan te roepen,
 * zodat deze functie ook vanuit een server-side context (niet-interactief)
 * gebruikt kan worden.
 */
async function getNextInvoiceNumberForUser(userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `${year}-`

  const result = await db.$queryRaw<[{ max_seq: number | null }]>(
    Prisma.sql`
      SELECT MAX(
        CAST(SUBSTRING("invoiceNumber" FROM POSITION('-' IN "invoiceNumber") + 1) AS INTEGER)
      ) AS max_seq
      FROM "Invoice"
      WHERE "userId" = ${userId} AND "invoiceNumber" LIKE ${prefix + "%"}
    `
  )

  const maxSeq = result[0]?.max_seq ?? 0
  return generateInvoiceNumber(year, maxSeq + 1)
}

// ─── Auto-invoice aanmaak ─────────────────────────────────────────────────────

/**
 * Maakt automatisch een conceptfactuur aan op basis van een ondertekende offerte.
 *
 * @returns { invoiceId, invoiceNumber } of null als autoCreateInvoice=false of
 *          als er al een factuur is aangemaakt voor deze offerte.
 */
export async function createInvoiceFromQuote(
  quoteId: string,
): Promise<{ invoiceId: string; invoiceNumber: string } | null> {
  // Haal offerte op inclusief regelitems
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  })

  if (!quote) return null

  // Niet aanmaken als autoCreateInvoice uitstaat of al een factuur bestaat
  if (!quote.autoCreateInvoice) return null
  if (quote.convertedInvoiceId) return null

  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + 30)

  // Retry-loop voor P2002 (unieke constraint op factuurnummer bij gelijktijdige aanmaak)
  const maxAttempts = 3
  let invoiceId: string | undefined
  let invoiceNumber: string | undefined

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = await getNextInvoiceNumberForUser(quote.userId)

    try {
      const invoice = await db.invoice.create({
        data: {
          userId: quote.userId,
          invoiceNumber: candidate,
          customerId: quote.customerId,
          invoiceDate: now,
          dueDate,
          status: "DRAFT",
          subtotal: quote.subtotal,
          vatAmount: quote.vatAmount,
          total: quote.total,
          currencyCode: quote.currencyCode,
          currencyId: quote.currencyId ?? undefined,
          reference: quote.reference,
          notes: quote.notes,
          items: {
            create: quote.items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              unit: item.unit,
              subtotal: item.subtotal,
              vatAmount: item.vatAmount,
              total: item.total,
              sortOrder: index,
            })),
          },
        },
        select: { id: true, invoiceNumber: true },
      })

      invoiceId = invoice.id
      invoiceNumber = invoice.invoiceNumber
      break
    } catch (err) {
      const isP2002 =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"

      if (!isP2002 || attempt === maxAttempts - 1) throw err

      // Korte pauze zodat een concurrerende insert kan committen
      await new Promise((r) => setTimeout(r, 80))
    }
  }

  if (!invoiceId || !invoiceNumber) throw new Error("Factuur aanmaken mislukt")

  // Koppel factuur aan offerte en zet status op CONVERTED
  await db.quote.update({
    where: { id: quoteId },
    data: {
      convertedInvoiceId: invoiceId,
      status: "CONVERTED",
    },
  })

  // Audittrail event loggen
  await logInvoiceCreated(quoteId, invoiceId, invoiceNumber)

  return { invoiceId, invoiceNumber }
}
