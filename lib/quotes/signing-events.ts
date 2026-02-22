/**
 * Hulpfuncties voor het loggen van offerte-ondertekeningsevents.
 *
 * Alle events worden vastgelegd in QuoteSigningEvent (audittrail).
 * Status- en tijdstempelwijzigingen op de Quote zelf worden hier gecoördineerd.
 *
 * Beschikbare helpers (één per eventtype):
 *   logSigningEvent()     — generieke logger (low-level)
 *   markQuoteViewed()     — eerste bezoek aan ondertekeningspagina
 *   logSigningLinkSent()  — uitnodigingse-mail verstuurd
 *   logReminderSent()     — herinneringse-mail verstuurd
 *   markSigningExpired()  — ondertekeningsverzoek verlopen
 *   logInvoiceCreated()   — factuur aangemaakt na ondertekening
 *   logPdfDownloaded()    — getekende PDF gedownload
 */

import { db } from "@/lib/db"
import { QuoteSigningEventType } from "@prisma/client"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SigningEventContext {
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

// ─── Enkel event (low-level) ──────────────────────────────────────────────────

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
 *   - Logt een VIEWED event
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

// ─── Ondertekeningsuitnodiging verzonden ──────────────────────────────────────

/**
 * Logt dat de ondertekeningsuitnodiging is verstuurd per e-mail.
 * Zet quote-status op SENT en signingStatus op PENDING (via sendSigningInvitationEmail).
 */
export async function logSigningLinkSent(
  quoteId: string,
  recipientEmail: string,
  context: SigningEventContext = {},
): Promise<void> {
  await logSigningEvent(quoteId, QuoteSigningEventType.SENT, {
    ...context,
    metadata: { ...context.metadata, recipientEmail },
  })
}

// ─── Herinnering verstuurd ────────────────────────────────────────────────────

/**
 * Logt dat een ondertekeningsherinnering is verstuurd.
 */
export async function logReminderSent(
  quoteId: string,
  recipientEmail: string,
  daysUntilExpiry: number,
  context: SigningEventContext = {},
): Promise<void> {
  await logSigningEvent(quoteId, QuoteSigningEventType.REMINDER_SENT, {
    ...context,
    metadata: { ...context.metadata, recipientEmail, daysUntilExpiry },
  })
}

// ─── Offerte verlopen ─────────────────────────────────────────────────────────

/**
 * Registreert dat een ondertekeningsverzoek is verlopen:
 *   - Zet signingStatus op EXPIRED en quoteStatus op EXPIRED (idempotent via updateMany)
 *   - Logt een EXPIRED event
 *
 * Aangeroepen bij het eerste bezoek aan een verlopen link zodat de status
 * in de database up-to-date is zonder een afzonderlijk cron-proces.
 */
export async function markSigningExpired(
  quoteId: string,
  context: SigningEventContext = {},
): Promise<void> {
  try {
    await db.quote.updateMany({
      where: {
        id: quoteId,
        signingStatus: { in: ["PENDING", "VIEWED"] },
      },
      data: { signingStatus: "EXPIRED", status: "EXPIRED" },
    })
    await logSigningEvent(quoteId, QuoteSigningEventType.EXPIRED, context)
  } catch (err) {
    console.error("[signing-events] markSigningExpired failed:", err)
  }
}

// ─── Factuur aangemaakt ───────────────────────────────────────────────────────

/**
 * Logt dat er automatisch een factuur is aangemaakt na ondertekening.
 */
export async function logInvoiceCreated(
  quoteId: string,
  invoiceId: string,
  invoiceNumber: string,
  context: SigningEventContext = {},
): Promise<void> {
  await logSigningEvent(quoteId, QuoteSigningEventType.INVOICE_CREATED, {
    ...context,
    metadata: { ...context.metadata, invoiceId, invoiceNumber },
  })
}

// ─── PDF gedownload ───────────────────────────────────────────────────────────

/**
 * Logt dat de (getekende) PDF is gedownload.
 */
export async function logPdfDownloaded(
  quoteId: string,
  context: SigningEventContext = {},
): Promise<void> {
  await logSigningEvent(quoteId, QuoteSigningEventType.DOWNLOADED, context)
}
