import Link from "next/link"
import { Plus } from "lucide-react"

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
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { StatusFilterTabs } from "@/components/status-filter-tabs"
import { formatCurrency, formatDate, CREDIT_NOTE_REASON_LABELS } from "@/lib/utils"
import { CreditNoteStatusBadge } from "@/components/creditnotes/credit-note-status-badge"
import { getCreditNotes } from "./actions"
import { CreditNoteActions } from "./credit-note-actions"
import { SearchForm } from "./search-form"
import { YearFilterSelect } from "@/components/year-filter-select"
import { T } from "@/components/t"

const CREDIT_NOTE_SORT_KEYS = ["creditNoteNumber", "customerName", "creditNoteDate", "reason", "total"] as const
type CreditNoteSortKey = (typeof CREDIT_NOTE_SORT_KEYS)[number]
function isCreditNoteSortKey(s: string | null | undefined): s is CreditNoteSortKey {
  return s != null && CREDIT_NOTE_SORT_KEYS.includes(s as CreditNoteSortKey)
}

interface CreditNotasPageProps {
  searchParams: Promise<{ status?: string; search?: string; year?: string; sortBy?: string; sortOrder?: string }>
}

export default async function CreditNotasPage({ searchParams }: CreditNotasPageProps) {
  const params = await searchParams
  const currentYearNum = new Date().getFullYear()
  const status = params.status || "ALL"
  const search = params.search || ""
  const yearParam = params.year === "all" ? null : (params.year ? parseInt(params.year, 10) : currentYearNum)
  const sortBy = isCreditNoteSortKey(params.sortBy) ? params.sortBy : "creditNoteDate"
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc"

  const creditNotes = await getCreditNotes(status === "ALL" ? undefined : status)

  // Filter by search term
  let filteredCreditNotes = search
    ? creditNotes.filter(
        (cn: typeof creditNotes[0]) =>
          cn.creditNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
          cn.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          cn.customer.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : creditNotes

  // Filter by year
  if (yearParam && !Number.isNaN(yearParam)) {
    filteredCreditNotes = filteredCreditNotes.filter((cn: typeof creditNotes[0]) => {
      const y = new Date(cn.creditNoteDate).getFullYear()
      return y === yearParam
    })
  }

  // Sort
  filteredCreditNotes = [...filteredCreditNotes].sort((a: typeof creditNotes[0], b: typeof creditNotes[0]) => {
    let cmp = 0
    switch (sortBy) {
      case "creditNoteNumber":
        cmp = a.creditNoteNumber.localeCompare(b.creditNoteNumber)
        break
      case "customerName":
        cmp = (a.customer.companyName || a.customer.name).localeCompare(b.customer.companyName || b.customer.name)
        break
      case "creditNoteDate":
        cmp = new Date(a.creditNoteDate).getTime() - new Date(b.creditNoteDate).getTime()
        break
      case "reason":
        cmp = (CREDIT_NOTE_REASON_LABELS[a.reason] ?? a.reason).localeCompare(CREDIT_NOTE_REASON_LABELS[b.reason] ?? b.reason)
        break
      case "total":
        cmp = a.total - b.total
        break
      default:
        cmp = new Date(a.creditNoteDate).getTime() - new Date(b.creditNoteDate).getTime()
    }
    return sortOrder === "asc" ? cmp : -cmp
  })

  // Calculate status counts
  const allCreditNotes = await getCreditNotes()
  const statusCounts = {
    ALL: allCreditNotes.length,
    DRAFT: allCreditNotes.filter((cn: typeof allCreditNotes[0]) => cn.status === "DRAFT").length,
    FINAL: allCreditNotes.filter((cn: typeof allCreditNotes[0]) => cn.status === "FINAL").length,
    SENT: allCreditNotes.filter((cn: typeof allCreditNotes[0]) => cn.status === "SENT").length,
    PROCESSED: allCreditNotes.filter((cn: typeof allCreditNotes[0]) => cn.status === "PROCESSED").length,
    REFUNDED: allCreditNotes.filter((cn: typeof allCreditNotes[0]) => cn.status === "REFUNDED").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight"><T ns="creditNotesPage" k="title" /></h2>
          <p className="text-muted-foreground">
            <T ns="creditNotesPage" k="description" />
          </p>
        </div>
        <Button asChild>
          <Link href="/creditnotas/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            <T ns="creditNotesPage" k="newCreditNote" />
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <StatusFilterTabs
              currentStatus={status}
              namespace="creditNotesPage"
              options={[
                { value: "ALL", labelKey: "statusAll", count: statusCounts.ALL, href: "/creditnotas" },
                { value: "DRAFT", labelKey: "statusDraft", count: statusCounts.DRAFT, href: "/creditnotas?status=DRAFT" },
                { value: "FINAL", labelKey: "statusFinal", count: statusCounts.FINAL, href: "/creditnotas?status=FINAL" },
                { value: "SENT", labelKey: "statusSent", count: statusCounts.SENT, href: "/creditnotas?status=SENT" },
                { value: "REFUNDED", labelKey: "statusRefunded", count: statusCounts.REFUNDED, href: "/creditnotas?status=REFUNDED" },
              ]}
            />

            <div className="flex flex-wrap items-center gap-2">
              <SearchForm currentStatus={status} />
              <YearFilterSelect
                years={(() => {
                  const years = new Set(allCreditNotes.map((cn: typeof allCreditNotes[0]) => new Date(cn.creditNoteDate).getFullYear()))
                  return Array.from(years).sort((a, b) => b - a)
                })()}
                currentYear={params.year === "all" ? "all" : (params.year ?? String(currentYearNum))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="creditNoteNumber"><T ns="creditNotesPage" k="colCreditNote" /></SortableTableHead>
                <SortableTableHead sortKey="customerName"><T ns="creditNotesPage" k="colCustomer" /></SortableTableHead>
                <SortableTableHead sortKey="creditNoteDate"><T ns="creditNotesPage" k="colDate" /></SortableTableHead>
                <SortableTableHead sortKey="reason"><T ns="creditNotesPage" k="colReason" /></SortableTableHead>
                <SortableTableHead sortKey="total" className="text-right"><T ns="creditNotesPage" k="colAmount" /></SortableTableHead>
                <TableHead className="text-center"><T ns="creditNotesPage" k="colStatus" /></TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      <T ns="creditNotesPage" k="noCreditNotes" />
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/creditnotas/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        <T ns="creditNotesPage" k="newCreditNote" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreditNotes.map((creditNote: typeof filteredCreditNotes[0]) => (
                  <TableRow key={creditNote.id}>
                    <TableCell>
                      <Link
                        href={`/creditnotas/${creditNote.id}`}
                        className="font-medium hover:underline"
                      >
                        {creditNote.creditNoteNumber}
                      </Link>
                      {creditNote.originalInvoice && (
                        <div className="text-sm text-muted-foreground">
                          voor {creditNote.originalInvoice.invoiceNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {creditNote.customer.companyName || creditNote.customer.name}
                        </div>
                        {creditNote.customer.companyName && (
                          <div className="text-sm text-muted-foreground">
                            {creditNote.customer.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(creditNote.creditNoteDate)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {CREDIT_NOTE_REASON_LABELS[creditNote.reason] || creditNote.reason}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -{formatCurrency(creditNote.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <CreditNoteStatusBadge status={creditNote.status} />
                    </TableCell>
                    <TableCell>
                      <CreditNoteActions
                        creditNote={{
                          id: creditNote.id,
                          status: creditNote.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
