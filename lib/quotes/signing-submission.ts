/**
 * Bedrijfslogica voor het verwerken van offerte-ondertekeningsinzendingen.
 *
 * Verantwoordelijkheden:
 *   - Zod-validatieschema's (gedeeld tussen API-routes en client-import)
 *   - XSS-preventie via sanitizeText (strip HTML-tags + gevaarlijke protocollen)
 *   - Signature-data validatie (max 500 KB, DRAWN = data-URL formaat)
 *   - Atomische database-transactie: QuoteSignature aanmaken + Quote updaten
 *   - Audittrail: QuoteSigningEvent loggen
 */

import { z } from "zod"
import { db } from "@/lib/db"
import { logSigningEvent } from "./signing-events"
import { QuoteSigningEventType, SignatureMethod } from "@prisma/client"

// ─── Constanten ───────────────────────────────────────────────────────────────

/** Maximale lengte van de base64-string voor DRAWN/UPLOADED handtekeningen. */
const MAX_SIGNATURE_DATA_CHARS = 700 * 1024 // ≈ 500 KB binair (base64 overhead ×4/3)

export const DEFAULT_AGREEMENT_TEXT =
  "Door het plaatsen van mijn handtekening ga ik akkoord met de inhoud van deze offerte. " +
  "Deze digitale handtekening heeft dezelfde juridische geldigheid als een handgeschreven handtekening."

// ─── XSS-preventie ───────────────────────────────────────────────────────────

/**
 * Stript HTML-tags en gevaarlijke protocollen uit tekstvelden.
 * Tekst wordt opgeslagen als plain-text (niet als HTML), maar sanitiseren
 * beschermt tegen injectie als de data later in een e-mail of PDF terechtkomt.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")          // HTML-tags verwijderen
    .replace(/javascript:/gi, "")     // javascript:-protocol
    .replace(/on\w+\s*=/gi, "")       // inline event handlers (onclick=, etc.)
    .trim()
}

// ─── Validatieschema's ────────────────────────────────────────────────────────

/**
 * Schema voor het indienen van een handtekening (akkoord).
 * Alle tekstvelden worden gesanitiseerd via .transform(sanitizeText).
 */
export const signQuoteSchema = z
  .object({
    signerName: z
      .string()
      .min(2, "Naam moet minimaal 2 tekens bevatten")
      .max(100, "Naam mag maximaal 100 tekens bevatten")
      .transform(sanitizeText),
    signerEmail: z
      .string()
      .email("Voer een geldig e-mailadres in")
      .max(255, "E-mailadres is te lang")
      .toLowerCase(),
    signerRole: z
      .string()
      .max(100, "Functie mag maximaal 100 tekens bevatten")
      .optional()
      .transform((v) => (v ? sanitizeText(v) : undefined)),
    signatureType: z.enum(["DRAWN", "TYPED", "UPLOADED"], {
      error: "Ongeldig handtekeningtype",
    }),
    signatureData: z
      .string()
      .min(1, "Handtekening is verplicht"),
    agreedToTerms: z.literal(true, {
      error: "U moet akkoord gaan met de voorwaarden",
    }),
    remarks: z
      .string()
      .max(1000, "Opmerkingen mogen maximaal 1000 tekens bevatten")
      .optional()
      .transform((v) => (v ? sanitizeText(v) : undefined)),
  })
  // Cross-field validatie: type-specifieke constraints op signatureData
  .superRefine((data, ctx) => {
    if (data.signatureType === "DRAWN" || data.signatureType === "UPLOADED") {
      // Base64 data-URL vereist voor canvas-handtekeningen
      if (!data.signatureData.startsWith("data:image/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ongeldige handtekeningafbeelding — teken opnieuw",
          path: ["signatureData"],
        })
        return
      }
      // Grootte: max ~500 KB (base64 string ≤ 700 KB)
      if (data.signatureData.length > MAX_SIGNATURE_DATA_CHARS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Handtekening is te groot (max 500 KB). Probeer opnieuw te tekenen.",
          path: ["signatureData"],
        })
      }
    } else if (data.signatureType === "TYPED") {
      // Getypte handtekening = de naam; mag niet leeg of te lang zijn
      if (data.signatureData.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Typ uw naam als handtekening",
          path: ["signatureData"],
        })
      } else if (data.signatureData.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Naam is te lang voor een handtekening (max 200 tekens)",
          path: ["signatureData"],
        })
      }
    }
  })

export type SignQuoteInput = z.infer<typeof signQuoteSchema>

/** Schema voor het afwijzen van een offerte. */
export const rejectQuoteSchema = z.object({
  signerName: z
    .string()
    .min(2, "Naam moet minimaal 2 tekens bevatten")
    .max(100)
    .transform(sanitizeText),
  signerEmail: z
    .string()
    .email("Voer een geldig e-mailadres in")
    .max(255)
    .toLowerCase(),
  remarks: z
    .string()
    .max(1000, "Opmerkingen mogen maximaal 1000 tekens bevatten")
    .optional()
    .transform((v) => (v ? sanitizeText(v) : undefined)),
})

export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>

// ─── Submission context ───────────────────────────────────────────────────────

export interface SubmissionContext {
  ipAddress?: string
  userAgent?: string
  agreementText?: string
}

// ─── Business logic: ondertekenen ─────────────────────────────────────────────

/**
 * Verwerkt een ondertekeningsinzending atomisch:
 *   1. Hercontroleert de quotestatus (race condition preventie)
 *   2. Slaat QuoteSignature op
 *   3. Zet de quotestatus op SIGNED
 *   4. Logt een audittrail-event
 */
export async function processSignRequest(
  quoteId: string,
  input: SignQuoteInput,
  context: SubmissionContext = {},
): Promise<{ signedAt: Date }> {
  const now = new Date()

  await db.$transaction(async (tx) => {
    // Hercontrole binnen transactie om race conditions te voorkomen
    const freshQuote = await tx.quote.findUnique({
      where: { id: quoteId },
      select: {
        signingEnabled: true,
        signingStatus: true,
        signingExpiresAt: true,
      },
    })

    if (!freshQuote) throw new SigningError("QUOTE_NOT_FOUND")
    if (!freshQuote.signingEnabled) throw new SigningError("SIGNING_DISABLED")
    if (freshQuote.signingStatus === "SIGNED") throw new SigningError("ALREADY_SIGNED")
    if (freshQuote.signingStatus === "DECLINED") throw new SigningError("ALREADY_DECLINED")
    if (
      freshQuote.signingExpiresAt != null &&
      now > freshQuote.signingExpiresAt
    ) {
      throw new SigningError("EXPIRED")
    }

    // QuoteSignature aanmaken
    await tx.quoteSignature.create({
      data: {
        quoteId,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signerIpAddress: context.ipAddress ?? null,
        signerUserAgent: context.userAgent ?? null,
        signatureMethod: input.signatureType as SignatureMethod,
        signatureData: input.signatureData,
        agreementText: context.agreementText ?? DEFAULT_AGREEMENT_TEXT,
        signedAt: now,
      },
    })

    // Quotestatus updaten
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "SIGNED",
        signingStatus: "SIGNED",
        signedAt: now,
      },
    })
  })

  // Audittrail buiten transactie (logSigningEvent slokt fouten)
  await logSigningEvent(quoteId, QuoteSigningEventType.SIGNED, {
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      signerName: input.signerName,
      signerEmail: input.signerEmail,
      signerRole: input.signerRole ?? null,
      signatureType: input.signatureType,
      hasRemarks: Boolean(input.remarks),
    },
  })

  return { signedAt: now }
}

// ─── Business logic: afwijzen ─────────────────────────────────────────────────

export async function processRejectRequest(
  quoteId: string,
  input: RejectQuoteInput,
  context: SubmissionContext = {},
): Promise<{ declinedAt: Date }> {
  const now = new Date()

  // Hercontrole buiten transactie (afwijzen is minder kritisch dan ondertekenen)
  const freshQuote = await db.quote.findUnique({
    where: { id: quoteId },
    select: { signingStatus: true, signingEnabled: true },
  })

  if (!freshQuote || !freshQuote.signingEnabled)
    throw new SigningError("SIGNING_DISABLED")
  if (freshQuote.signingStatus === "SIGNED")
    throw new SigningError("ALREADY_SIGNED")
  if (freshQuote.signingStatus === "DECLINED")
    throw new SigningError("ALREADY_DECLINED")

  await db.quote.update({
    where: { id: quoteId },
    data: {
      status: "DECLINED",
      signingStatus: "DECLINED",
      declinedAt: now,
    },
  })

  await logSigningEvent(quoteId, QuoteSigningEventType.DECLINED, {
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      signerName: input.signerName,
      signerEmail: input.signerEmail,
      remarks: input.remarks ?? null,
    },
  })

  return { declinedAt: now }
}

// ─── Foutklasse ───────────────────────────────────────────────────────────────

export class SigningError extends Error {
  constructor(
    public readonly code:
      | "QUOTE_NOT_FOUND"
      | "SIGNING_DISABLED"
      | "ALREADY_SIGNED"
      | "ALREADY_DECLINED"
      | "EXPIRED",
  ) {
    super(code)
    this.name = "SigningError"
  }
}

/** Vertaalt een SigningError naar een HTTP-status en Nederlandstalige boodschap. */
export function signingErrorResponse(err: SigningError): {
  status: number
  message: string
} {
  switch (err.code) {
    case "ALREADY_SIGNED":
      return { status: 409, message: "Deze offerte is al ondertekend." }
    case "ALREADY_DECLINED":
      return { status: 409, message: "Deze offerte is al afgewezen." }
    case "EXPIRED":
      return { status: 410, message: "De ondertekeningslink is verlopen." }
    case "SIGNING_DISABLED":
      return { status: 403, message: "Ondertekening is niet ingeschakeld voor deze offerte." }
    default:
      return { status: 404, message: "Offerte niet gevonden." }
  }
}
