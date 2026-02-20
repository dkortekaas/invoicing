/**
 * Utilities voor het genereren en valideren van offerte ondertekenings-tokens.
 *
 * Token strategie: randomBytes(24).toString('base64url') → 32 tekens.
 * Base64url-encoding (RFC 4648 §5) is URL-safe (geen +, /, of =), waardoor
 * het token direct als route-segment of query-param gebruikt kan worden.
 * 24 bytes = 192 bits entropie → onraadbaar zonder brute-force bescherming.
 *
 * De plaintext-token wordt in de database opgeslagen (zoals paymentLinkToken),
 * omdat de signing-URL publiek is en de token al als geheim dient.
 */

import { randomBytes } from "crypto"
import { db } from "@/lib/db"

// ─── Token generatie ──────────────────────────────────────────────────────────

/**
 * Genereert een cryptografisch veilig ondertekening-token.
 * randomBytes(24).toString('base64url') produceert precies 32 tekens.
 */
export function generateSigningToken(): string {
  return randomBytes(24).toString("base64url")
}

/**
 * Bouwt de volledige publieke ondertekenings-URL op basis van een token.
 * Pad: /offerte/ondertekenen/[token]
 */
export function generateSigningUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${baseUrl}/offerte/ondertekenen/${token}`
}

// ─── Database queries ─────────────────────────────────────────────────────────

/**
 * Prisma include-definitie voor de ondertekeningspagina.
 * Minimalistische selectie: alleen velden die de klant te zien krijgt.
 */
const signingInclude = {
  customer: {
    select: {
      name: true,
      companyName: true,
      email: true,
    },
  },
  items: {
    orderBy: { sortOrder: "asc" as const },
  },
  user: {
    select: {
      company: {
        select: {
          name: true,
          logo: true,
        },
      },
    },
  },
  signature: true,
} as const

// Private helper — uitsluitend bedoeld om het retourtype te induceren;
// voorkomt een circulaire type-referentie als QuoteForSigning afgeleid zou
// worden van getQuoteBySigningToken (die QuoteForSigning zelf teruggeeft).
async function _fetchQuoteBySigningToken(token: string) {
  return db.quote.findUnique({
    where: { signingToken: token },
    include: signingInclude,
  })
}

/** Type van een offerte inclusief alle data die de ondertekeningspagina nodig heeft. */
export type QuoteForSigning = NonNullable<
  Awaited<ReturnType<typeof _fetchQuoteBySigningToken>>
>

/**
 * Haalt een offerte op aan de hand van het signing-token.
 * Geeft null terug als het token onbekend is.
 */
export async function getQuoteBySigningToken(
  token: string,
): Promise<QuoteForSigning | null> {
  return _fetchQuoteBySigningToken(token)
}

// ─── Validatie ────────────────────────────────────────────────────────────────

export type SigningInvalidReason =
  | "signing_disabled" // signingEnabled === false
  | "expired"          // signingExpiresAt < now
  | "already_signed"   // signingStatus === SIGNED
  | "already_declined" // signingStatus === DECLINED

export type SigningValidityResult =
  | { valid: true }
  | { valid: false; reason: SigningInvalidReason }

/**
 * Controleert of een offerte-object in een geldige staat is om ondertekend
 * te worden. Voert GEEN database-query uit; werkt op een reeds opgehaald object.
 */
export function isSigningValid(quote: {
  signingEnabled: boolean
  signingExpiresAt: Date | null
  signingStatus: string | null
}): SigningValidityResult {
  if (!quote.signingEnabled) {
    return { valid: false, reason: "signing_disabled" }
  }

  if (quote.signingExpiresAt && new Date() > quote.signingExpiresAt) {
    return { valid: false, reason: "expired" }
  }

  if (quote.signingStatus === "SIGNED") {
    return { valid: false, reason: "already_signed" }
  }

  if (quote.signingStatus === "DECLINED") {
    return { valid: false, reason: "already_declined" }
  }

  return { valid: true }
}
