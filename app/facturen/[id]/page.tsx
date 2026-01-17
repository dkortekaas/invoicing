import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
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
import { getInvoice, updateInvoiceStatus, deleteInvoice } from "../actions"
import { InvoiceActionsClient } from "./invoice-actions-client"
import { InvoicePreview } from "./invoice-preview"

interface FactuurDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function FactuurDetailPage({ params }: FactuurDetailPageProps) {
  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) {
    notFound()
  }

  // Group VAT by rate for display
  const vatByRate = invoice.items.reduce((acc, item) => {
    const rate = item.vatRate.toNumber().toString()
    if (!acc[rate]) {
      acc[rate] = { subtotal: 0, vatAmount: 0 }
    }
    acc[rate].subtotal += item.subtotal.toNumber()
    acc[rate].vatAmount += item.vatAmount.toNumber()
    return acc
  }, {} as Record<string, { subtotal: number; vatAmount: number }>)

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
          <Button variant="outline" asChild>
            <a href={`/api/invoices/${invoice.id}/pdf`} download>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>

          <InvoiceActionsClient
            invoice={{
              id: invoice.id,
              status: invoice.status,
            }}
          />
        </div>
      </div>

      <InvoicePreview invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber}>
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
                  {invoice.user.vatNumber && (
                    <p className="text-sm text-muted-foreground">
                      BTW: {invoice.user.vatNumber}
                    </p>
                  )}
                  {invoice.user.kvkNumber && (
                    <p className="text-sm text-muted-foreground">
                      KvK: {invoice.user.kvkNumber}
                    </p>
                  )}
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
                        {formatCurrency(item.quantity)} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.vatRate.toNumber()}%
                      </TableCell>
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
                  {Object.entries(vatByRate).map(([rate, { subtotal, vatAmount }]) => (
                    <TableRow key={rate}>
                      <TableCell colSpan={4}>
                        BTW {rate}% over {formatCurrency(subtotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(vatAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4}>Totaal BTW</TableCell>
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
                <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
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
          {invoice.user.iban && (
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
          )}

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
      </InvoicePreview>
    </div>
  )
}
