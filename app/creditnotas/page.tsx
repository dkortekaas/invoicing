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
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate, CREDIT_NOTE_REASON_LABELS } from "@/lib/utils"
import { CreditNoteStatusBadge } from "@/components/creditnotes/credit-note-status-badge"
import { getCreditNotes } from "./actions"
import { CreditNoteActions } from "./credit-note-actions"
import { SearchForm } from "./search-form"

interface CreditNotasPageProps {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function CreditNotasPage({ searchParams }: CreditNotasPageProps) {
  const params = await searchParams
  const status = params.status || "ALL"
  const search = params.search || ""

  const creditNotes = await getCreditNotes(status === "ALL" ? undefined : status)

  // Filter op search term als die bestaat
  const filteredCreditNotes = search
    ? creditNotes.filter(
        (cn: typeof creditNotes[0]) =>
          cn.creditNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
          cn.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          cn.customer.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : creditNotes

  // Bereken status counts
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Credit Nota&apos;s</h2>
          <p className="text-muted-foreground">
            Beheer credit nota&apos;s voor correcties en terugbetalingen
          </p>
        </div>
        <Button asChild>
          <Link href="/creditnotas/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Credit Nota
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs defaultValue={status}>
              <TabsList>
                <TabsTrigger value="ALL" asChild>
                  <Link href="/creditnotas">Alle ({statusCounts.ALL})</Link>
                </TabsTrigger>
                <TabsTrigger value="DRAFT" asChild>
                  <Link href="/creditnotas?status=DRAFT">
                    Concept ({statusCounts.DRAFT})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="FINAL" asChild>
                  <Link href="/creditnotas?status=FINAL">
                    Definitief ({statusCounts.FINAL})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="SENT" asChild>
                  <Link href="/creditnotas?status=SENT">
                    Verzonden ({statusCounts.SENT})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="REFUNDED" asChild>
                  <Link href="/creditnotas?status=REFUNDED">
                    Terugbetaald ({statusCounts.REFUNDED})
                  </Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <SearchForm currentStatus={status} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit Nota</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Reden</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nog geen credit nota&apos;s.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/creditnotas/nieuw">
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuwe Credit Nota
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
