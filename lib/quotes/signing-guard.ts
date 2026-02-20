/**
 * Validatie-middleware voor publieke offerte ondertekenings-endpoints.
 *
 * Gebruik:
 *   const result = await validateSigningAccess(token, clientIp)
 *   if (!result.valid) {
 *     return NextResponse.json(
 *       { error: SIGNING_ERROR_MESSAGES[result.reason] },
 *       { status: result.httpStatus, headers: result.headers },
 *     )
 *   }
 *   // result.quote is nu veilig te gebruiken
 *
 * Controles (in volgorde):
 *   1. Rate limit  – max 10 pogingen per uur per token
 *   2. Token lookup – token bestaat in database
 *   3. Inhoudelijke validatie – niet verlopen / al ondertekend / signing uitgeschakeld
 */

import { rateLimit, retryAfterInfo, RATE_LIMITS } from "@/lib/rate-limit"
import {
  getQuoteBySigningToken,
  isSigningValid,
  type QuoteForSigning,
  type SigningInvalidReason,
} from "./signing-tokens"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SigningGuardReason =
  | "rate_limited"
  | "not_found"
  | SigningInvalidReason

export type SigningGuardSuccess = {
  valid: true
  quote: QuoteForSigning
}

export type SigningGuardFailure = {
  valid: false
  reason: SigningGuardReason
  /** HTTP-statuscode die de caller terug moet sturen. */
  httpStatus: 404 | 410 | 403 | 429
  /** Seconden tot rate-limit reset (alleen bij reason === "rate_limited"). */
  retryAfterSeconds?: number
  /** Kant-en-klare response-headers (bijv. Retry-After). */
  headers?: Record<string, string>
}

export type SigningGuardResult = SigningGuardSuccess | SigningGuardFailure

// ─── Nederlandse foutmeldingen ────────────────────────────────────────────────

export const SIGNING_ERROR_MESSAGES: Record<SigningGuardReason, string> = {
  rate_limited:
    "Te veel pogingen. Probeer het later opnieuw.",
  not_found:
    "Deze ondertekeningslink is ongeldig of bestaat niet meer.",
  signing_disabled:
    "Digitale ondertekening is niet ingeschakeld voor deze offerte.",
  expired:
    "Deze ondertekeningslink is verlopen. Neem contact op met de afzender.",
  already_signed:
    "Deze offerte is al ondertekend.",
  already_declined:
    "Deze offerte is al afgewezen.",
}

// ─── Guard ────────────────────────────────────────────────────────────────────

/**
 * Valideert toegang tot een publieke signing-endpoint.
 *
 * @param token    Het signing-token uit de URL
 * @param clientIp Optioneel IP-adres van de bezoeker (alleen voor logging)
 */
export async function validateSigningAccess(
  token: string,
  /** Optioneel IP-adres; gereserveerd voor toekomstige logging/detectie. */
  _clientIp?: string,
): Promise<SigningGuardResult> {
  // 1. Rate limit – per token, 10 pogingen per uur
  //    Sleutel op het token zelf: voorkomt enumeratie van tokens én beperkt
  //    herhaalde pogingen op een specifieke offerte.
  const rateLimitKey = `signing-attempt:${token}`
  const { allowed, resetAt } = await rateLimit(rateLimitKey, RATE_LIMITS.signing)

  if (!allowed) {
    const { seconds } = retryAfterInfo(resetAt)
    return {
      valid: false,
      reason: "rate_limited",
      httpStatus: 429,
      retryAfterSeconds: seconds,
      headers: {
        "Retry-After": String(seconds),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  }

  // 2. Token lookup
  const quote = await getQuoteBySigningToken(token)

  if (!quote) {
    // Geen onderscheid maken tussen "nooit bestaan" en "al verwijderd":
    // uniforme 404 voorkomt token-enumeratie.
    return { valid: false, reason: "not_found", httpStatus: 404 }
  }

  // 3. Inhoudelijke validatie
  const validity = isSigningValid(quote)

  if (!validity.valid) {
    const httpStatus =
      validity.reason === "signing_disabled" ? 403 : 410

    return { valid: false, reason: validity.reason, httpStatus }
  }

  return { valid: true, quote }
}
