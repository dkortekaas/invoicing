/**
 * Hulpfuncties voor het loggen van offerte-ondertekeningsevents.
 *
 * Alle events worden vastgelegd in QuoteSigningEvent (audittrail).
 * Status- en tijdstempelwijzigingen op de Quote zelf worden hier gecoördineerd.
 */

import { db } from "@/lib/db"
import { QuoteSigningEventType } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SigningEventContext {
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

// ─── Enkel event ─────────────────────────────────────────────────────────────

/**
 * Schrijft één ondertekeningsevent naar de audittrail.
 * Gooit nooit: fouten worden geslokt zodat event-logging de hoofdflow niet blokkeert.
 */
export async function logSigningEvent(
  quoteId: string,
  eventType: QuoteSigningEventType,
  context: SigningEventContext = {},
): Promise<void> {
  try {
    await db.quoteSigningEvent.create({
      data: {
        quoteId,
        eventType,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        // Prisma JSON-veld vereist een cast omdat Record<string,unknown> niet
        // exact overeenkomt met InputJsonValue in strict mode.
        metadata: (context.metadata ??
          undefined) as Parameters<typeof db.quoteSigningEvent.create>[0]["data"]["metadata"],
      },
    })
  } catch (err) {
    // Logging mag de gebruikerservaring nooit breken
    console.error("[signing-events] logSigningEvent failed:", err)
  }
}

// ─── Eerste bezoek ───────────────────────────────────────────────────────────

/**
 * Registreert het eerste bezoek aan de ondertekeningspagina:
 *   - Zet `viewedAt` als dit nog leeg is (idempotent bij herhaald bezoek)
 *   - Brengt `signingStatus` van PENDING naar VIEWED
 *   - Logt een VIEWED event (QUOTE_VIEWED)
 *
 * Veilig om meerdere keren aan te roepen: updateMany met where-guards zorgt
 * dat statusovergangen slechts één keer plaatsvinden.
 */
export async function markQuoteViewed(
  quoteId: string,
  context: SigningEventContext = {},
): Promise<void> {
  try {
    const now = new Date()

    await Promise.all([
      // Zet viewedAt alleen bij eerste bezoek
      db.quote.updateMany({
        where: { id: quoteId, viewedAt: null },
        data: { viewedAt: now },
      }),
      // PENDING → VIEWED (eenmalig)
      db.quote.updateMany({
        where: { id: quoteId, signingStatus: "PENDING" },
        data: { signingStatus: "VIEWED" },
      }),
    ])

    await logSigningEvent(quoteId, QuoteSigningEventType.VIEWED, context)
  } catch (err) {
    console.error("[signing-events] markQuoteViewed failed:", err)
  }
}
