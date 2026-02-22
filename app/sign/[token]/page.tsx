/**
 * Publieke ondertekeningspagina — /sign/:token
 *
 * Server Component: haalt data op, logt events, rendert de offerte.
 * Geen authenticatie vereist; toegang wordt bewaakt door validateSigningAccess
 * (rate limiting + tokenvalidatie + statuscontrole).
 *
 * Events die hier worden gelogd:
 *   - SIGNING_STARTED  → pagina geopend (= SIGNING_LINK_OPENED)
 *   - VIEWED           → offerte bekeken (= QUOTE_VIEWED, eerste keer)
 */

import { headers } from "next/headers"
import Image from "next/image"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"
import type { Metadata } from "next"

import { validateSigningAccess } from "@/lib/quotes/signing-guard"
import { logSigningEvent, markQuoteViewed } from "@/lib/quotes/signing-events"
import { formatDate, formatDateLong, formatCurrencyWithCode } from "@/lib/utils"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { QuoteSigningEventType } from "@prisma/client"
import SigningForm from "@/components/quotes/SigningForm"
import { DEFAULT_AGREEMENT_TEXT } from "@/lib/quotes/signing-submission"

export const dynamic = "force-dynamic"

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const result = await validateSigningAccess(token)
  if (!result.valid) return { title: "Offerte ondertekening" }
  return {
    title: `Offerte ${result.quote.quoteNumber} — ter goedkeuring`,
    robots: { index: false, follow: false },
  }
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ token: string }>
}

export default async function SignPage({ params }: Props) {
  const { token } = await params

  const headersList = await headers()
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined
  const userAgent = headersList.get("user-agent") ?? undefined

  // Validatie (rate limit + token lookup + statuscheck)
  const result = await validateSigningAccess(token, ip)

  if (!result.valid) {
    return (
      <SigningLayout>
        <ErrorCard reason={result.reason} retryAfter={result.httpStatus === 429 ? result.retryAfterSeconds : undefined} />
      </SigningLayout>
    )
  }

  const { quote } = result

  // Events loggen (niet-blokkerend via Promise.allSettled)
  await Promise.allSettled([
    logSigningEvent(quote.id, QuoteSigningEventType.SIGNING_STARTED, { ipAddress: ip, userAgent }),
    markQuoteViewed(quote.id, { ipAddress: ip, userAgent }),
  ])

  // Haal de aangepaste akkoordtekst op (valt terug op de standaardtekst)
  const userSettings = await db.userSigningSettings.findUnique({
    where: { userId: quote.userId },
    select: { agreementText: true },
  })
  const agreementText = userSettings?.agreementText ?? DEFAULT_AGREEMENT_TEXT

  const company = quote.user.company
  const now = new Date()

  const isSigned = quote.signingStatus === "SIGNED"
  const isDeclined = quote.signingStatus === "DECLINED"
  const isExpired =
    !isSigned &&
    !isDeclined &&
    quote.signingExpiresAt != null &&
    now > quote.signingExpiresAt

  return (
    <SigningLayout>
      {/* Bedrijfsbranding */}
      <header className="text-center space-y-3 pb-2">
        {company?.logo && (
          <div className="flex justify-center">
            <Image
              src={company.logo}
              alt={company.name ?? "Bedrijfslogo"}
              width={140}
              height={70}
              className="max-h-[70px] w-auto object-contain"
            />
          </div>
        )}
        {company?.name && (
          <p className="text-base font-semibold text-gray-900">{company.name}</p>
        )}
      </header>

      {/* Statusbanner */}
      {isSigned && (
        <StatusBanner
          icon={<CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
          className="bg-green-50 border-green-200 text-green-800"
        >
          Ondertekend op {formatDateLong(quote.signedAt!)}
        </StatusBanner>
      )}
      {isDeclined && (
        <StatusBanner
          icon={<XCircle className="h-5 w-5 shrink-0 text-red-600" />}
          className="bg-red-50 border-red-200 text-red-800"
        >
          Afgewezen op {formatDateLong(quote.declinedAt!)}
        </StatusBanner>
      )}
      {isExpired && (
        <StatusBanner
          icon={<Clock className="h-5 w-5 shrink-0 text-amber-600" />}
          className="bg-amber-50 border-amber-200 text-amber-800"
        >
          Verlopen op {formatDateLong(quote.signingExpiresAt!)}
        </StatusBanner>
      )}

      {/* Offertegegevens */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardDescription className="text-xs uppercase tracking-wide">
                Offerte ter goedkeuring
              </CardDescription>
              <CardTitle className="mt-1 text-xl">
                {quote.quoteNumber}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {quote.customer.companyName ?? quote.customer.name}
              </p>
            </div>
            <SigningStatusBadge
              signingStatus={quote.signingStatus}
              quoteStatus={quote.status}
              isExpired={isExpired}
            />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Offertedatum</dt>
              <dd className="font-medium mt-0.5">{formatDate(quote.quoteDate)}</dd>
            </div>
            {quote.expiryDate && (
              <div>
                <dt className="text-muted-foreground">Offerte geldig tot</dt>
                <dd className="font-medium mt-0.5">{formatDate(quote.expiryDate)}</dd>
              </div>
            )}
            {quote.reference && (
              <div>
                <dt className="text-muted-foreground">Referentie</dt>
                <dd className="font-medium mt-0.5">{quote.reference}</dd>
              </div>
            )}
            {quote.signingExpiresAt && !isExpired && !isSigned && !isDeclined && (
              <div>
                <dt className="text-muted-foreground text-amber-700">
                  Ondertekenen vóór
                </dt>
                <dd className="font-semibold text-amber-700 mt-0.5">
                  {formatDate(quote.signingExpiresAt)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Regelitems */}
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-3 text-left font-medium">Omschrijving</th>
                <th className="pb-3 text-right font-medium">Aantal</th>
                <th className="pb-3 text-right font-medium hidden sm:table-cell">
                  Prijs
                </th>
                <th className="pb-3 text-right font-medium">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-medium">{item.description}</span>
                  </td>
                  <td className="py-3 text-right text-muted-foreground whitespace-nowrap">
                    {Number(item.quantity).toLocaleString("nl-NL")} {item.unit}
                  </td>
                  <td className="py-3 text-right text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                    {formatCurrencyWithCode(item.unitPrice, quote.currencyCode)}
                  </td>
                  <td className="py-3 text-right font-medium whitespace-nowrap">
                    {formatCurrencyWithCode(item.total, quote.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Separator className="my-4" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotaal</span>
              <span>{formatCurrencyWithCode(quote.subtotal, quote.currencyCode)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>BTW</span>
              <span>{formatCurrencyWithCode(quote.vatAmount, quote.currencyCode)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Totaal</span>
              <span>{formatCurrencyWithCode(quote.total, quote.currencyCode)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opmerkingen */}
      {quote.notes && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Opmerkingen</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quote.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {!isSigned && !isDeclined && !isExpired && (
        <Card id="signing-area">
          <CardContent className="pt-6">
            <SigningForm token={token} agreementText={agreementText} />
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pb-4">
        Beveiligd via Declair
      </footer>
    </SigningLayout>
  )
}

// ─── Sub-componenten ──────────────────────────────────────────────────────────

function SigningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-5">{children}</main>
    </div>
  )
}

function StatusBanner({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  className: string
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${className}`}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}

function SigningStatusBadge({
  signingStatus,
  quoteStatus,
  isExpired,
}: {
  signingStatus: string | null
  quoteStatus: string
  isExpired: boolean
}) {
  if (signingStatus === "SIGNED")
    return <Badge className="bg-green-100 text-green-800 border-green-200">Ondertekend</Badge>
  if (signingStatus === "DECLINED")
    return <Badge variant="destructive">Afgewezen</Badge>
  if (isExpired)
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Verlopen</Badge>
  if (signingStatus === "VIEWED" || signingStatus === "PENDING")
    return <Badge variant="outline">Ter goedkeuring</Badge>
  return <Badge variant="secondary">{quoteStatus}</Badge>
}

function ErrorCard({
  reason,
  retryAfter,
}: {
  reason: string
  retryAfter?: number
}) {
  const messages: Record<string, { title: string; body: string }> = {
    rate_limited: {
      title: "Te veel pogingen",
      body: retryAfter
        ? `Probeer het over ${Math.ceil(retryAfter / 60)} minuten opnieuw.`
        : "Probeer het later opnieuw.",
    },
    not_found: {
      title: "Link onbekend",
      body: "Deze ondertekeningslink is ongeldig of bestaat niet meer.",
    },
    expired: {
      title: "Link verlopen",
      body: "De geldigheidsperiode voor ondertekening is verstreken. Neem contact op met de afzender.",
    },
    already_signed: {
      title: "Al ondertekend",
      body: "Deze offerte is al ondertekend.",
    },
    already_declined: {
      title: "Al afgewezen",
      body: "Deze offerte is al afgewezen.",
    },
    signing_disabled: {
      title: "Ondertekening niet beschikbaar",
      body: "Digitale ondertekening is niet ingeschakeld voor deze offerte.",
    },
  }

  const msg = messages[reason] ?? {
    title: "Fout",
    body: "Er is een onbekende fout opgetreden.",
  }

  return (
    <Card>
      <CardContent className="pt-8 pb-8 text-center space-y-3">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold text-gray-900">{msg.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{msg.body}</p>
        </div>
      </CardContent>
    </Card>
  )
}
