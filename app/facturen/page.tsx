import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/import-export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { StatusFilterTabs } from "@/components/status-filter-tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { getInvoices } from "./actions"
import { InvoiceActions } from "./invoice-actions"
import { SearchForm } from "./search-form"
import { YearFilterSelect } from "@/components/year-filter-select"
import { Pagination } from "@/components/ui/pagination"

const PAGE_SIZE = 50

const INVOICE_SORT_KEYS = ["invoiceNumber", "customerName", "invoiceDate", "dueDate", "total"] as const
type InvoiceSortKey = (typeof INVOICE_SORT_KEYS)[number]
function isInvoiceSortKey(s: string | null | undefined): s is InvoiceSortKey {
  return s != null && INVOICE_SORT_KEYS.includes(s as InvoiceSortKey)
}

interface FacturenPageProps {
  searchParams: Promise<{ status?: string; search?: string; year?: string; sortBy?: string; sortOrder?: string; page?: string }>
}

export default async function FacturenPage({ searchParams }: FacturenPageProps) {
  const params = await searchParams
  const status = params.status || "ALL"
  const search = params.search || ""
  const yearParam = params.year ? parseInt(params.year, 10) : null
  const sortBy = isInvoiceSortKey(params.sortBy) ? params.sortBy : "invoiceDate"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1)

  const invoices = await getInvoices(status === "ALL" ? undefined : status)

  // Filter op search term
  let filteredInvoices = search
    ? invoices.filter(
        (invoice: typeof invoices[0]) =>
          invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          invoice.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          invoice.customer.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  // Filter op jaar
  if (yearParam && !Number.isNaN(yearParam)) {
    filteredInvoices = filteredInvoices.filter((invoice: typeof invoices[0]) => {
      const y = new Date(invoice.invoiceDate).getFullYear()
      return y === yearParam
    })
  }

  // Sorteren
  filteredInvoices = [...filteredInvoices].sort((a: typeof invoices[0], b: typeof invoices[0]) => {
    let cmp = 0
    switch (sortBy) {
      case "invoiceNumber":
        cmp = a.invoiceNumber.localeCompare(b.invoiceNumber)
        break
      case "customerName":
        cmp = (a.customer.companyName || a.customer.name).localeCompare(b.customer.companyName || b.customer.name)
        break
      case "invoiceDate":
        cmp = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
        break
      case "dueDate":
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      case "total":
        cmp = a.total - b.total
        break
      default:
        cmp = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
    }
    return sortOrder === "asc" ? cmp : -cmp
  })

  // Bereken status counts
  const allInvoices = await getInvoices()
  const statusCounts = {
    ALL: allInvoices.length,
    DRAFT: allInvoices.filter((i: typeof allInvoices[0]) => i.status === "DRAFT").length,
    SENT: allInvoices.filter((i: typeof allInvoices[0]) => i.status === "SENT").length,
    PAID: allInvoices.filter((i: typeof allInvoices[0]) => i.status === "PAID").length,
    OVERDUE: allInvoices.filter((i: typeof allInvoices[0]) => i.status === "OVERDUE").length,
  }

  // Pagination
  const totalItems = filteredInvoices.length
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturen</h2>
          <p className="text-muted-foreground">
            Beheer en verstuur je facturen
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton entityType="INVOICES" totalCount={allInvoices.length} />
          <Button asChild>
            <Link href="/facturen/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Factuur
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <StatusFilterTabs
              currentStatus={status}
              options={[
                { value: "ALL", label: "Alle", count: statusCounts.ALL, href: "/facturen" },
                { value: "DRAFT", label: "Concept", count: statusCounts.DRAFT, href: "/facturen?status=DRAFT" },
                { value: "SENT", label: "Verzonden", count: statusCounts.SENT, href: "/facturen?status=SENT" },
                { value: "PAID", label: "Betaald", count: statusCounts.PAID, href: "/facturen?status=PAID" },
                { value: "OVERDUE", label: "Achterstallig", count: statusCounts.OVERDUE, href: "/facturen?status=OVERDUE" },
              ]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <SearchForm currentStatus={status} />
              <YearFilterSelect
                years={(() => {
                  const years = new Set(allInvoices.map((i: typeof allInvoices[0]) => new Date(i.invoiceDate).getFullYear()))
                  return Array.from(years).sort((a, b) => b - a)
                })()}
                currentYear={params.year ?? null}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="invoiceNumber">Factuur</SortableTableHead>
                <SortableTableHead sortKey="customerName">Klant</SortableTableHead>
                <SortableTableHead sortKey="invoiceDate">Datum</SortableTableHead>
                <SortableTableHead sortKey="dueDate">Vervaldatum</SortableTableHead>
                <SortableTableHead sortKey="total" className="text-right">Bedrag</SortableTableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nog geen facturen. Maak je eerste factuur!
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/facturen/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuwe Factuur
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice: typeof paginatedInvoices[0]) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/facturen/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invoice.customer.companyName || invoice.customer.name}
                        </div>
                        {invoice.customer.companyName && (
                          <div className="text-sm text-muted-foreground">
                            {invoice.customer.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      <InvoiceActions
                        invoice={{
                          id: invoice.id,
                          status: invoice.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
