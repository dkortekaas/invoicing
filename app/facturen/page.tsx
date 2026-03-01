import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/import-export"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { StatusFilterTabs } from "@/components/status-filter-tabs"
import { getInvoices, getInvoiceStatusCounts, getInvoiceYears, getDeletedInvoiceCount } from "./actions"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { SearchForm } from "./search-form"
import { YearFilterSelect } from "@/components/year-filter-select"
import { Pagination } from "@/components/ui/pagination"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"
import { getServerT } from "@/lib/i18n"

const PAGE_SIZE = 50

const INVOICE_SORT_KEYS = ["invoiceNumber", "customerName", "invoiceDate", "dueDate", "total"] as const
type InvoiceSortKey = (typeof INVOICE_SORT_KEYS)[number]
function isInvoiceSortKey(s: string | null | undefined): s is InvoiceSortKey {
  return s != null && INVOICE_SORT_KEYS.includes(s as InvoiceSortKey)
}

interface FacturenPageProps {
  searchParams: Promise<{ status?: string; search?: string; year?: string; sortBy?: string; sortOrder?: string; page?: string; deleted?: string }>
}

export default async function FacturenPage({ searchParams }: FacturenPageProps) {
  const t = await getServerT("invoicesPage")
  const params = await searchParams
  const currentYearNum = new Date().getFullYear()
  const showDeleted = params.deleted === "true"
  const status = params.status || "ALL"
  const search = params.search || ""
  const yearParam = params.year === "all" ? null : (params.year ? parseInt(params.year, 10) : currentYearNum)
  const sortBy = isInvoiceSortKey(params.sortBy) ? params.sortBy : "invoiceDate"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1)

  const userId = await getCurrentUserId()

  const [
    { invoices: paginatedInvoices, total: totalItems },
    statusCounts,
    years,
    deletedCount,
    activeConnectionCount,
  ] = await Promise.all([
    getInvoices({
      status: showDeleted || status === "ALL" ? undefined : status,
      search: search || undefined,
      year: yearParam && !Number.isNaN(yearParam) ? yearParam : undefined,
      sortBy,
      sortOrder,
      page: currentPage,
      pageSize: PAGE_SIZE,
      deletedOnly: showDeleted,
    }),
    getInvoiceStatusCounts(),
    getInvoiceYears(),
    getDeletedInvoiceCount(),
    db.accountingConnection.count({ where: { userId, isActive: true } }),
  ])

  const hasAccountingConnections = activeConnectionCount > 0

  // Serialize for the client component: invoiceDate/dueDate/deletedAt → ISO strings
  const invoiceRows = paginatedInvoices.map((inv) => ({
    ...inv,
    invoiceDate: inv.invoiceDate instanceof Date
      ? inv.invoiceDate.toISOString()
      : String(inv.invoiceDate),
    dueDate: inv.dueDate instanceof Date
      ? inv.dueDate.toISOString()
      : String(inv.dueDate),
    deletedAt: inv.deletedAt
      ? (inv.deletedAt instanceof Date ? inv.deletedAt.toISOString() : String(inv.deletedAt))
      : null,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          {!showDeleted && <ExportButton entityType="INVOICES" totalCount={statusCounts.ALL} />}
          {showDeleted ? (
            <Button variant="outline" asChild>
              <Link href="/facturen">{t("backToInvoices")}</Link>
            </Button>
          ) : (
            <>
              {deletedCount > 0 && (
                <Button variant="outline" asChild>
                  <Link href="/facturen?deleted=true">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("trash")} ({deletedCount})
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/facturen/nieuw">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("newInvoice")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <StatusFilterTabs
              currentStatus={status}
              options={[
                { value: "ALL", label: t("statusAll"), count: statusCounts.ALL, href: "/facturen" },
                { value: "DRAFT", label: t("statusDraft"), count: statusCounts.DRAFT, href: "/facturen?status=DRAFT" },
                { value: "SENT", label: t("statusSent"), count: statusCounts.SENT, href: "/facturen?status=SENT" },
                { value: "PAID", label: t("statusPaid"), count: statusCounts.PAID, href: "/facturen?status=PAID" },
                { value: "OVERDUE", label: t("statusOverdue"), count: statusCounts.OVERDUE, href: "/facturen?status=OVERDUE" },
              ]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <SearchForm currentStatus={status} />
              <YearFilterSelect
                years={years}
                currentYear={params.year === "all" ? "all" : (params.year ?? String(currentYearNum))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <InvoiceTable
            invoices={invoiceRows}
            hasAccountingConnections={hasAccountingConnections}
            showDeleted={showDeleted}
            emptyMessage={
              showDeleted
                ? t("trashEmpty")
                : search
                ? t("noResults").replace("{search}", search)
                : t("noInvoices")
            }
          />
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
