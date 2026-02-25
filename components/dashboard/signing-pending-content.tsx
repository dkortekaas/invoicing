"use client"

import Link from "next/link"
import { AlertTriangle, Clock, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, cn } from "@/lib/utils"
import { useTranslations } from "@/components/providers/locale-provider"

type PendingQuote = {
  id: string
  quoteNumber: string
  total: number
  signingStatus: string | null
  signingExpiresAt: string | null
  customer: { name: string; companyName: string | null }
  waitDays: number | null
  nearlyExpired: boolean
}

interface SigningPendingContentProps {
  quotes: PendingQuote[]
}

export function SigningPendingContent({ quotes }: SigningPendingContentProps) {
  const { t, locale } = useTranslations("dashboard")

  if (quotes.length === 0) return null

  const totalValue = quotes.reduce(
    (sum, q) => sum + Number(q.total),
    0,
  )
  const nearlyExpiredCount = quotes.filter((q) => q.nearlyExpired).length

  return (
    <Card className={nearlyExpiredCount > 0 ? "border-amber-300 bg-amber-50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4" />
          {t("signing.title")}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/offertes">{t("signing.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Samenvatting */}
        <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm border">
          <span className="text-muted-foreground">
            {quotes.length === 1
              ? t("signing.countWaiting").replace("{count}", "1")
              : t("signing.countWaitingPlural").replace("{count}", quotes.length.toString())}
          </span>
          <span className="font-semibold">{formatCurrency(totalValue)}</span>
        </div>

        {nearlyExpiredCount > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {nearlyExpiredCount === 1
                ? t("signing.countExpiring").replace("{count}", "1")
                : t("signing.countExpiringPlural").replace("{count}", nearlyExpiredCount.toString())}
            </span>
          </div>
        )}

        {/* Lijst */}
        <div className="space-y-2">
          {quotes.slice(0, 5).map((quote) => (
            <Link
              key={quote.id}
              href={`/offertes/${quote.id}`}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50",
                quote.nearlyExpired && "border-amber-300 bg-amber-50/50",
              )}
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{quote.quoteNumber}</span>
                  {quote.nearlyExpired && (
                    <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-800 text-xs">
                      {t("signing.nearlyExpired")}
                    </Badge>
                  )}
                  {quote.signingStatus === "VIEWED" && (
                    <Badge variant="outline" className="text-xs">
                      {t("signing.viewed")}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-muted-foreground">
                  {quote.customer.companyName || quote.customer.name}
                </p>
              </div>
              <div className="ml-3 shrink-0 text-right space-y-0.5">
                <p className="font-medium">{formatCurrency(quote.total)}</p>
                {quote.waitDays !== null && (
                  <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {quote.waitDays === 0
                      ? t("signing.sentToday")
                      : quote.waitDays === 1
                        ? t("signing.daysWaiting").replace("{days}", "1")
                        : t("signing.daysWaitingPlural").replace("{days}", quote.waitDays.toString())}
                  </p>
                )}
                {quote.signingExpiresAt && (
                  <p className={cn("text-xs", quote.nearlyExpired ? "text-amber-700 font-medium" : "text-muted-foreground")}>
                    {t("signing.expiresOn")}{" "}
                    {new Date(quote.signingExpiresAt).toLocaleDateString(locale === "nl" ? "nl-NL" : "en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {quotes.length > 5 && (
            <p className="text-center text-xs text-muted-foreground pt-1">
              {quotes.length - 5 === 1
                ? t("signing.moreQuotes").replace("{count}", "1")
                : t("signing.moreQuotesPlural").replace("{count}", (quotes.length - 5).toString())}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
