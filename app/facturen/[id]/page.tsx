import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import { Separator } from "@/components/ui/separator"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { formatCurrency, formatDate, formatDateLong } from "@/lib/utils"

interface FactuurDetailPageProps {
  params: Promise<{ id: string }>
}

// Placeholder data
const invoice = {
  id: "1",
  invoiceNumber: "2025-0024",
  status: "SENT",
  invoiceDate: new Date("2025-01-15"),
  dueDate: new Date("2025-02-14"),
  reference: "PO-12345",
  notes: "Betaling graag binnen 30 dagen.",
  subtotal: 1033.06,
  vatAmount: 216.94,
  total: 1250.0,
  customer: {
    name: "Jan Janssen",
    companyName: "Acme B.V.",
    email: "jan@acme.nl",
    address: "Kerkstraat 123",
    postalCode: "1012 AB",
    city: "Amsterdam",
    country: "Nederland",
    vatNumber: "NL123456789B01",
  },
  items: [
    {
      id: "1",
      description: "Consultancy werkzaamheden",
      quantity: 8,
      unit: "uur",
      unitPrice: 95.0,
      vatRate: 21,
      subtotal: 760.0,
      vatAmount: 159.6,
      total: 919.6,
    },
    {
      id: "2",
      description: "Ontwikkeling nieuwe features",
      quantity: 3,
      unit: "uur",
      unitPrice: 85.0,
      vatRate: 21,
      subtotal: 255.0,
      vatAmount: 53.55,
      total: 308.55,
    },
  ],
  user: {
    companyName: "Mijn Bedrijf",
    companyEmail: "info@mijnbedrijf.nl",
    companyAddress: "Hoofdstraat 1",
    companyPostalCode: "1234 AB",
    companyCity: "Amsterdam",
    vatNumber: "NL987654321B01",
    kvkNumber: "12345678",
    iban: "NL91ABNA0417164300",
  },
}

export default async function FactuurDetailPage({ params }: FactuurDetailPageProps) {
  const { id } = await params

  // In productie: haal factuur op uit database
  // const invoice = await getInvoice(id)

  if (!invoice) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facturen">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                Factuur {invoice.invoiceNumber}
              </h2>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground">
              {formatDateLong(invoice.invoiceDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>

          {invoice.status === "DRAFT" && (
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Verzenden
            </Button>
          )}

          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
            <Button>
              <CheckCircle className="mr-2 h-4 w-4" />
              Markeer als betaald
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/facturen/${id}/bewerken`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bewerken
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijderen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Addresses */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Van
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{invoice.user.companyName}</p>
                  <p>{invoice.user.companyAddress}</p>
                  <p>
                    {invoice.user.companyPostalCode} {invoice.user.companyCity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    BTW: {invoice.user.vatNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    KvK: {invoice.user.kvkNumber}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {invoice.customer.companyName && (
                    <p className="font-semibold">{invoice.customer.companyName}</p>
                  )}
                  <p className={!invoice.customer.companyName ? "font-semibold" : ""}>
                    {invoice.customer.name}
                  </p>
                  <p>{invoice.customer.address}</p>
                  <p>
                    {invoice.customer.postalCode} {invoice.customer.city}
                  </p>
                  {invoice.customer.vatNumber && (
                    <p className="text-sm text-muted-foreground">
                      BTW: {invoice.customer.vatNumber}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice items */}
          <Card>
            <CardHeader>
              <CardTitle>Factuurregels</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="text-right">Aantal</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                    <TableHead className="text-right">BTW</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">{item.vatRate}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Subtotaal</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.subtotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4}>BTW (21%)</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.vatAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell colSpan={4}>Totaal</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice info */}
          <Card>
            <CardHeader>
              <CardTitle>Factuurgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Factuurnummer</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Factuurdatum</span>
                <span>{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vervaldatum</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.reference && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referentie</span>
                    <span>{invoice.reference}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </CardContent>
          </Card>

          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle>Betalingsgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">IBAN</span>
                <span className="font-mono text-sm">{invoice.user.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">T.n.v.</span>
                <span>{invoice.user.companyName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Te betalen</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(invoice.total)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
