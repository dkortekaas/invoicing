import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Send,
  AlertCircle,
  FileCheck,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { SigningStatusBadge } from "@/components/quotes/signing-status-badge"
import SigningPanelActivate from "@/components/quotes/SigningPanelActivate"
import SigningPanelActions from "@/components/quotes/SigningPanelActions"
import { getQuoteById } from "../actions"
import { T } from "@/components/t"

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>
}

const SIGNING_EVENT_ICONS: Record<string, React.ReactNode> = {
  CREATED: <Clock className="h-4 w-4 text-gray-500" />,
  SENT: <Send className="h-4 w-4 text-blue-500" />,
  VIEWED: <Eye className="h-4 w-4 text-indigo-500" />,
  SIGNING_STARTED: <FileCheck className="h-4 w-4 text-yellow-500" />,
  SIGNED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  DECLINED: <XCircle className="h-4 w-4 text-red-500" />,
  EXPIRED: <AlertCircle className="h-4 w-4 text-orange-500" />,
  REMINDER_SENT: <Clock className="h-4 w-4 text-blue-400" />,
  INVOICE_CREATED: <CheckCircle2 className="h-4 w-4 text-purple-500" />,
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params
  const quote = await getQuoteById(id)

  if (!quote) notFound()

  const subtotal = Number(quote.subtotal)
  const vatAmount = Number(quote.vatAmount)
  const total = Number(quote.total)
  const isSigned = quote.status === "SIGNED"
  const isDeclined = quote.status === "DECLINED"
  const isExpired = quote.status === "EXPIRED"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/offertes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{quote.quoteNumber}</h2>
            <QuoteStatusBadge status={quote.status} />
            {quote.signingEnabled && (
              <SigningStatusBadge status={quote.signingStatus} />
            )}
          </div>
          <p className="text-muted-foreground">
            {quote.customer.companyName || quote.customer.name}
            {quote.customer.companyName && ` · ${quote.customer.name}`}
          </p>
        </div>
        {!isSigned && quote.status !== "CONVERTED" && (
          <Button variant="outline" asChild>
            <Link href={`/offertes/${quote.id}/bewerken`}>
              <T ns="quotesPage" k="editButton" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote details */}
          <Card>
            <CardHeader>
              <CardTitle><T ns="quotesPage" k="detailsCardTitle" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground"><T ns="quotesPage" k="quoteNumberLabel" /></p>
                  <p className="font-medium">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground"><T ns="quotesPage" k="quoteDateLabel" /></p>
                  <p className="font-medium">{formatDate(quote.quoteDate)}</p>
                </div>
                {quote.expiryDate && (
                  <div>
                    <p className="text-muted-foreground"><T ns="quotesPage" k="validUntilLabel" /></p>
                    <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                      {formatDate(quote.expiryDate)}
                    </p>
                  </div>
                )}
                {quote.reference && (
                  <div>
                    <p className="text-muted-foreground"><T ns="quotesPage" k="referenceLabel" /></p>
                    <p className="font-medium">{quote.reference}</p>
                  </div>
                )}
              </div>

              {/* Customer */}
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1"><T ns="quotesPage" k="customerLabel" /></p>
                <p className="font-medium">{quote.customer.companyName || quote.customer.name}</p>
                {quote.customer.companyName && (
                  <p className="text-muted-foreground">{quote.customer.name}</p>
                )}
                {quote.customer.email && (
                  <p className="text-muted-foreground">{quote.customer.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader>
              <CardTitle><T ns="quotesPage" k="linesCardTitle" /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2 border-b">
                  <span className="col-span-6"><T ns="quotesPage" k="colLineDescription" /></span>
                  <span className="col-span-2 text-right"><T ns="quotesPage" k="colLineQuantity" /></span>
                  <span className="col-span-2 text-right"><T ns="quotesPage" k="colLinePrice" /></span>
                  <span className="col-span-2 text-right"><T ns="quotesPage" k="colLineTotal" /></span>
                </div>
                {quote.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 text-sm py-2">
                    <div className="col-span-6">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <T ns="quotesPage" k="vatRateLabel" vars={{ rate: String(Number(item.vatRate)) }} />
                      </p>
                    </div>
                    <span className="col-span-2 text-right text-muted-foreground">
                      {Number(item.quantity)} {item.unit}
                    </span>
                    <span className="col-span-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </span>
                    <span className="col-span-2 text-right font-medium">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}

                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground"><T ns="quotesPage" k="subtotalLabel" /></span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground"><T ns="quotesPage" k="vatLabel" /></span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-1">
                    <span><T ns="quotesPage" k="totalLabel" /></span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle><T ns="quotesPage" k="notesCardTitle" /></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Signing panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck className="h-4 w-4" />
                <T ns="quotesPage" k="signingCardTitle" />
              </CardTitle>
              {!quote.signingEnabled && (
                <CardDescription>
                  <T ns="quotesPage" k="signingCardDesc" />
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* State 1: Not active */}
              {!quote.signingEnabled && (
                <SigningPanelActivate quoteId={quote.id} />
              )}

              {/* State 2: Awaiting signing (PENDING / VIEWED) */}
              {quote.signingEnabled && !isSigned && !isDeclined && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground"><T ns="quotesPage" k="signingStatusLabel" /></span>
                    <SigningStatusBadge status={quote.signingStatus} />
                  </div>

                  {quote.signingExpiresAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground"><T ns="quotesPage" k="signingValidUntilLabel" /></span>
                      <span className={isExpired ? "text-red-600 font-medium" : ""}>
                        {formatDate(quote.signingExpiresAt)}
                      </span>
                    </div>
                  )}

                  {quote.sentAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground"><T ns="quotesPage" k="signingSentAtLabel" /></span>
                      <span>{formatDate(quote.sentAt)}</span>
                    </div>
                  )}

                  {quote.viewedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground"><T ns="quotesPage" k="signingViewedAtLabel" /></span>
                      <span>{formatDate(quote.viewedAt)}</span>
                    </div>
                  )}

                  {quote.signingUrl && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5"><T ns="quotesPage" k="signingLinkLabel" /></p>
                        <code className="text-xs bg-muted px-2 py-1.5 rounded block break-all mb-2">
                          {quote.signingUrl}
                        </code>
                        <SigningPanelActions
                          quoteId={quote.id}
                          signingUrl={quote.signingUrl}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* State 3: Signed */}
              {isSigned && quote.signedAt && (
                <>
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-md p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium"><T ns="quotesPage" k="signedStateLabel" /></p>
                      <p className="text-green-600">{formatDate(quote.signedAt)}</p>
                    </div>
                  </div>

                  {quote.signature && (
                    <div className="text-sm space-y-1 pt-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide"><T ns="quotesPage" k="signerLabel" /></p>
                      <p className="font-medium">{quote.signature.signerName}</p>
                      {quote.signature.signerRole && (
                        <p className="text-muted-foreground text-xs">{quote.signature.signerRole}</p>
                      )}
                      <p className="text-muted-foreground text-xs">{quote.signature.signerEmail}</p>
                      {quote.signature.remarks && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-0.5"><T ns="quotesPage" k="customerRemarksLabel" /></p>
                          <p className="text-xs italic">&ldquo;{quote.signature.remarks}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}

                  {quote.signingToken && (
                    <>
                      <Separator />
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a
                          href={`/api/signing/${quote.signingToken}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          <T ns="quotesPage" k="downloadSignedPdf" />
                        </a>
                      </Button>
                    </>
                  )}

                  {quote.convertedInvoice && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1"><T ns="quotesPage" k="invoiceCreatedLabel" /></p>
                        <Link
                          href={`/facturen/${quote.convertedInvoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {quote.convertedInvoice.invoiceNumber}
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* State 4: Declined */}
              {isDeclined && quote.declinedAt && (
                <>
                  <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-md p-3">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium"><T ns="quotesPage" k="declinedStateLabel" /></p>
                      <p className="text-red-600">{formatDate(quote.declinedAt)}</p>
                    </div>
                  </div>

                  {quote.signature?.remarks && (
                    <div className="text-sm pt-1">
                      <p className="text-xs text-muted-foreground mb-0.5"><T ns="quotesPage" k="declineReasonLabel" /></p>
                      <p className="text-xs italic">&ldquo;{quote.signature.remarks}&rdquo;</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Audit trail / signing events */}
          {quote.signingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle><T ns="quotesPage" k="historyCardTitle" /></CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative border-l border-muted-foreground/20 ml-2 space-y-4">
                  {quote.signingEvents.map((event) => (
                    <li key={event.id} className="pl-4">
                      <div className="absolute -left-[9px] bg-background">
                        {SIGNING_EVENT_ICONS[event.eventType] ?? (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        <T ns="quotesPage" k={`signingEvent_${event.eventType}`} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(event.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
