import Link from "next/link"
import {
  Plus,
} from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { getInvoices } from "./actions"
import { InvoiceActions } from "./invoice-actions"
import { SearchForm } from "./search-form"

interface FacturenPageProps {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function FacturenPage({ searchParams }: FacturenPageProps) {
  const params = await searchParams
  const status = params.status || "ALL"
  const search = params.search || ""

  const invoices = await getInvoices(status === "ALL" ? undefined : status)

  // Filter op search term als die bestaat
  const filteredInvoices = search
    ? invoices.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          invoice.customer.name.toLowerCase().includes(search.toLowerCase()) ||
          invoice.customer.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices

  // Bereken status counts
  const allInvoices = await getInvoices()
  const statusCounts = {
    ALL: allInvoices.length,
    DRAFT: allInvoices.filter((i) => i.status === "DRAFT").length,
    SENT: allInvoices.filter((i) => i.status === "SENT").length,
    PAID: allInvoices.filter((i) => i.status === "PAID").length,
    OVERDUE: allInvoices.filter((i) => i.status === "OVERDUE").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturen</h2>
          <p className="text-muted-foreground">
            Beheer en verstuur je facturen
          </p>
        </div>
        <Button asChild>
          <Link href="/facturen/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Factuur
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
                  <Link href="/facturen">Alle ({statusCounts.ALL})</Link>
                </TabsTrigger>
                <TabsTrigger value="DRAFT" asChild>
                  <Link href="/facturen?status=DRAFT">
                    Concept ({statusCounts.DRAFT})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="SENT" asChild>
                  <Link href="/facturen?status=SENT">
                    Verzonden ({statusCounts.SENT})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="PAID" asChild>
                  <Link href="/facturen?status=PAID">
                    Betaald ({statusCounts.PAID})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="OVERDUE" asChild>
                  <Link href="/facturen?status=OVERDUE">
                    Achterstallig ({statusCounts.OVERDUE})
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
                <TableHead>Factuur</TableHead>
                <TableHead>Klant</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Vervaldatum</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
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
                filteredInvoices.map((invoice) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
