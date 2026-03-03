/**
 * Klantportaal — /klantportaal/:token
 *
 * Publieke pagina (geen inlogvereiste) waartoe klanten toegang krijgen via een
 * uniek portaaltoken. Toont alle offertes van de klant met hun ondertekening-
 * status. Openstaande offertes hebben een directe link naar de ondertekenings-
 * pagina (/sign/:signingToken).
 *
 * Veiligheid: toegang via cryptografisch sterk, uniek token (32 bytes hex).
 */

import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, FileText, PenLine, XCircle } from "lucide-react"
import type { Metadata } from "next"

import { db } from "@/lib/db"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { getServerT } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const t = await getServerT("customerPortalPage")
  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: { name: true, companyName: true },
  })
  if (!customer) return { title: t("title") }
  const company = customer.companyName ?? customer.name
  return {
    title: t("titleWithCompany").replace("{company}", company),
    robots: { index: false, follow: false },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_KEYS: Record<string, string> = {
  PENDING: "statusPending",
  VIEWED: "statusViewed",
  SIGNED: "statusSigned",
  DECLINED: "statusDeclined",
  EXPIRED: "statusExpired",
}

function getSigningStatusLabel(status: string | null, t: (k: string) => string) {
  const key = status ? STATUS_KEYS[status] : null
  return key ? t(key) : t("statusNotSent")
}

function signingStatusColors(status: string | null): string {
  switch (status) {
    case "PENDING":  return "bg-amber-100 text-amber-800 border-amber-300"
    case "VIEWED":   return "bg-blue-100 text-blue-800 border-blue-300"
    case "SIGNED":   return "bg-green-100 text-green-800 border-green-300"
    case "DECLINED": return "bg-red-100 text-red-800 border-red-300"
    case "EXPIRED":  return "bg-gray-100 text-gray-700 border-gray-300"
    default:         return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

function SigningStatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case "SIGNED":   return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "DECLINED": return <XCircle className="h-4 w-4 text-red-600" />
    case "EXPIRED":  return <Clock className="h-4 w-4 text-gray-500" />
    default:         return <PenLine className="h-4 w-4 text-amber-600" />
  }
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ token: string }>
}

export default async function KlantportaalPage({ params }: Props) {
  const { token } = await params
  const t = await getServerT("customerPortalPage")

  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      user: {
        select: {
          company: { select: { name: true, logo: true } },
        },
      },
      quotes: {
        where: {
          status: { not: "DRAFT" },
        },
        orderBy: { quoteDate: "desc" },
        select: {
          id: true,
          quoteNumber: true,
          quoteDate: true,
          expiryDate: true,
          status: true,
          total: true,
          signingEnabled: true,
          signingStatus: true,
          signingUrl: true,
          signingExpiresAt: true,
          signedAt: true,
          declinedAt: true,
          sentAt: true,
        },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  const company = customer.user?.company
  const customerName = customer.companyName ?? customer.name

  const pendingQuotes = customer.quotes.filter(
    (q) => q.signingEnabled && (q.signingStatus === "PENDING" || q.signingStatus === "VIEWED"),
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-4">
          {company?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo}
              alt={company.name ?? "Logo"}
              className="h-8 w-auto object-contain"
            />
          )}
          <div>
            {company?.name && (
              <p className="text-sm font-semibold">{company.name}</p>
            )}
            <p className="text-xs text-muted-foreground">{t("headerLabel")}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Welkom */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welkom, {customerName}</h1>
          <p className="text-muted-foreground mt-1">
            Hier vindt u een overzicht van uw offertes. Openstaande offertes kunt u direct ondertekenen.
          </p>
        </div>

        {/* Openstaande ondertekeningen */}
        {pendingQuotes.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PenLine className="h-4 w-4" />
                {t("pendingSigningTitle")}
              </CardTitle>
              <CardDescription>
                {t("pendingSigningDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between rounded-lg border border-amber-300 bg-white px-4 py-3 gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{quote.quoteNumber}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", signingStatusColors(quote.signingStatus))}
                      >
                        {getSigningStatusLabel(quote.signingStatus, t)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                      <span>Datum: {formatDate(quote.quoteDate)}</span>
                      <span className="font-medium text-foreground">{formatCurrency(quote.total)}</span>
                      {quote.signingExpiresAt && (
                        <span>
                          Verloopt: {formatDate(quote.signingExpiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {quote.signingUrl && (
                    <Button size="sm" asChild>
                      <Link href={quote.signingUrl}>
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                        {t("signButton")}
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Alle offertes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("allQuotesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.quotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Er zijn nog geen offertes beschikbaar.
              </p>
            ) : (
              <div className="divide-y">
                {customer.quotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <SigningStatusIcon status={quote.signingStatus} />
                        <span className="font-medium text-sm">{quote.quoteNumber}</span>
                        {quote.signingEnabled && (
                          <Badge
                            variant="outline"
                            className={cn("text-xs", signingStatusColors(quote.signingStatus))}
                          >
                            {getSigningStatusLabel(quote.signingStatus, t)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                        <span>{formatDate(quote.quoteDate)}</span>
                        <span className="font-medium text-foreground">{formatCurrency(quote.total)}</span>
                        {quote.signedAt && (
                          <span className="text-green-700">{t("signedOn").replace("{date}", formatDate(quote.signedAt))}</span>
                        )}
                        {quote.declinedAt && (
                          <span className="text-red-600">{t("declinedOn").replace("{date}", formatDate(quote.declinedAt))}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {quote.signingEnabled &&
                        (quote.signingStatus === "PENDING" || quote.signingStatus === "VIEWED") &&
                        quote.signingUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={quote.signingUrl}>
                              <PenLine className="mr-1.5 h-3.5 w-3.5" />
                              {t("signButton")}
                            </Link>
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <p className="text-center text-xs text-muted-foreground">
          {t("secureNotice")}
        </p>
      </main>
    </div>
  )
}
