import { getPendingSigningQuotes } from "@/app/offertes/actions"
import { SigningPendingContent } from "./signing-pending-content"

export async function SigningPendingWidget() {
  const quotes = await getPendingSigningQuotes()

  // Serialize dates to strings and Decimals to numbers for client component
  const serializedQuotes = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    total: Number(q.total),
    signingStatus: q.signingStatus,
    signingExpiresAt: q.signingExpiresAt ? q.signingExpiresAt.toISOString() : null,
    customer: q.customer,
    waitDays: q.waitDays,
    nearlyExpired: q.nearlyExpired,
  }))

  return <SigningPendingContent quotes={serializedQuotes} />
}
