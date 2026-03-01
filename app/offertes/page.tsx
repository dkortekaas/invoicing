import Link from "next/link"
import { Plus, FileSignature } from "lucide-react"

export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { StatusFilterTabs } from "@/components/status-filter-tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { SigningStatusBadge } from "@/components/quotes/signing-status-badge"
import { getQuotes, getQuoteStatusCounts } from "./actions"
import { T } from "@/components/t"

const PAGE_SIZE = 50

interface OffortesPageProps {
  searchParams: Promise<{
    status?: string
    signingStatus?: string
    search?: string
    year?: string
    page?: string
  }>
}

export default async function OffertesPage({ searchParams }: OffortesPageProps) {
  const params = await searchParams
  const currentYearNum = new Date().getFullYear()
  const status = params.status || "ALL"
  const signingStatus = params.signingStatus || "ALL"
  const search = params.search || ""
  const yearParam = params.year === "all" ? null : (params.year ? parseInt(params.year, 10) : currentYearNum)
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1)

  const [{ quotes, total: totalItems }, statusCounts] = await Promise.all([
    getQuotes({
      status: status === "ALL" ? undefined : (status as never),
      signingStatus: signingStatus === "ALL" ? undefined : signingStatus,
      search: search || undefined,
      year: yearParam && !Number.isNaN(yearParam) ? yearParam : undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getQuoteStatusCounts(),
  ])

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight"><T ns="quotesPage" k="title" /></h2>
          <p className="text-muted-foreground">
            <T ns="quotesPage" k="description" />
          </p>
        </div>
        <Button asChild>
          <Link href="/offertes/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            <T ns="quotesPage" k="newQuote" />
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <StatusFilterTabs
            currentStatus={status}
            namespace="quotesPage"
            options={[
              { value: "ALL", labelKey: "statusAll", count: statusCounts.ALL, href: "/offertes" },
              { value: "DRAFT", labelKey: "statusDraft", count: statusCounts.DRAFT, href: "/offertes?status=DRAFT" },
              { value: "SENT", labelKey: "statusSent", count: statusCounts.SENT, href: "/offertes?status=SENT" },
              { value: "VIEWED", labelKey: "statusViewed", count: statusCounts.VIEWED, href: "/offertes?status=VIEWED" },
              { value: "SIGNED", labelKey: "statusSigned", count: statusCounts.SIGNED, href: "/offertes?status=SIGNED" },
              { value: "DECLINED", labelKey: "statusDeclined", count: statusCounts.DECLINED, href: "/offertes?status=DECLINED" },
              { value: "EXPIRED", labelKey: "statusExpired", count: statusCounts.EXPIRED, href: "/offertes?status=EXPIRED" },
            ]}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offerte</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Verloopdatum</TableHead>
                <TableHead className="text-right"><T ns="quotesPage" k="colAmount" /></TableHead>
                <TableHead className="text-center"><T ns="quotesPage" k="colStatus" /></TableHead>
                <TableHead className="text-center"><T ns="quotesPage" k="colSigning" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {search ? (
                      <p className="text-muted-foreground">
                        <T ns="quotesPage" k="noResults" />
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          <T ns="quotesPage" k="noQuotes" />
                        </p>
                        <Button asChild className="mt-4">
                          <Link href="/offertes/nieuw">
                            <Plus className="mr-2 h-4 w-4" />
                            <T ns="quotesPage" k="newQuote" />
                          </Link>
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link
                        href={`/offertes/${quote.id}`}
                        className="font-medium hover:underline"
                      >
                        {quote.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {quote.customer.companyName || quote.customer.name}
                        </div>
                        {quote.customer.companyName && (
                          <div className="text-sm text-muted-foreground">
                            {quote.customer.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(quote.quoteDate)}</TableCell>
                    <TableCell>
                      {quote.expiryDate ? formatDate(quote.expiryDate) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {quote.signingEnabled ? (
                        <SigningStatusBadge status={quote.signingStatus} />
                      ) : (
                        <span className="text-muted-foreground text-sm flex items-center justify-center gap-1">
                          <FileSignature className="h-3 w-3" />
                          Uit
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {totalItems} offerte{totalItems !== 1 ? "s" : ""} totaal
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/offertes?page=${currentPage - 1}${status !== "ALL" ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                    >
                      Vorige
                    </Link>
                  </Button>
                )}
                <span className="flex items-center text-sm text-muted-foreground px-2">
                  Pagina {currentPage} van {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/offertes?page=${currentPage + 1}${status !== "ALL" ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                    >
                      Volgende
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
