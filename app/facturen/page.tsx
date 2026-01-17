import Link from "next/link"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  CheckCircle,
  Send,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// Placeholder data
const invoices = [
  {
    id: "1",
    invoiceNumber: "2025-0024",
    customer: { name: "Jan Janssen", companyName: "Acme B.V." },
    total: 1250.0,
    status: "SENT",
    invoiceDate: new Date("2025-01-15"),
    dueDate: new Date("2025-02-14"),
  },
  {
    id: "2",
    invoiceNumber: "2025-0023",
    customer: { name: "Maria de Vries", companyName: "Tech Solutions" },
    total: 3500.0,
    status: "PAID",
    invoiceDate: new Date("2025-01-10"),
    dueDate: new Date("2025-02-09"),
  },
  {
    id: "3",
    invoiceNumber: "2025-0022",
    customer: { name: "Peter van den Berg", companyName: null },
    total: 850.0,
    status: "OVERDUE",
    invoiceDate: new Date("2024-12-15"),
    dueDate: new Date("2025-01-14"),
  },
  {
    id: "4",
    invoiceNumber: "2025-0021",
    customer: { name: "Lisa Bakker", companyName: "Design Studio" },
    total: 2100.0,
    status: "DRAFT",
    invoiceDate: new Date("2025-01-16"),
    dueDate: new Date("2025-02-15"),
  },
]

const statusCounts = {
  ALL: invoices.length,
  DRAFT: invoices.filter((i) => i.status === "DRAFT").length,
  SENT: invoices.filter((i) => i.status === "SENT").length,
  PAID: invoices.filter((i) => i.status === "PAID").length,
  OVERDUE: invoices.filter((i) => i.status === "OVERDUE").length,
}

export default function FacturenPage() {
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
            <Tabs defaultValue="ALL">
              <TabsList>
                <TabsTrigger value="ALL">
                  Alle ({statusCounts.ALL})
                </TabsTrigger>
                <TabsTrigger value="DRAFT">
                  Concept ({statusCounts.DRAFT})
                </TabsTrigger>
                <TabsTrigger value="SENT">
                  Verzonden ({statusCounts.SENT})
                </TabsTrigger>
                <TabsTrigger value="PAID">
                  Betaald ({statusCounts.PAID})
                </TabsTrigger>
                <TabsTrigger value="OVERDUE">
                  Achterstallig ({statusCounts.OVERDUE})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek facturen..."
                className="pl-9"
              />
            </div>
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
              {invoices.length === 0 ? (
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
                invoices.map((invoice) => (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acties</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/facturen/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Bekijken
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/facturen/${invoice.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {invoice.status === "DRAFT" && (
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Markeer als verzonden
                            </DropdownMenuItem>
                          )}
                          {(invoice.status === "SENT" ||
                            invoice.status === "OVERDUE") && (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Markeer als betaald
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
