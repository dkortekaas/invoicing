import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
import {
  ArrowLeft,
  Download,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { Separator } from "@/components/ui/separator"
import { CreditNoteStatusBadge } from "@/components/creditnotes/credit-note-status-badge"
import { formatCurrency, formatDate, formatDateLong, CREDIT_NOTE_REASON_LABELS } from "@/lib/utils"
import { getCreditNote } from "../actions"
import { CreditNoteActionsClient } from "./credit-note-actions-client"

interface CreditNotaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CreditNotaDetailPage({ params }: CreditNotaDetailPageProps) {
  const { id } = await params
  const creditNote = await getCreditNote(id)

  if (!creditNote) {
    notFound()
  }

  // Group VAT by rate for display
  const vatByRate = creditNote.items.reduce((acc: Record<string, { subtotal: number; vatAmount: number }>, item: typeof creditNote.items[0]) => {
    const rate = item.vatRate.toString()
    if (!acc[rate]) {
      acc[rate] = { subtotal: 0, vatAmount: 0 }
    }
    acc[rate].subtotal += item.subtotal
    acc[rate].vatAmount += item.vatAmount
    return acc
  }, {} as Record<string, { subtotal: number; vatAmount: number }>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/creditnotas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                Credit Nota {creditNote.creditNoteNumber}
              </h2>
              <CreditNoteStatusBadge status={creditNote.status} />
            </div>
            <p className="text-muted-foreground">
              {formatDateLong(creditNote.creditNoteDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/creditnotes/${creditNote.id}/pdf`} download>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>

          <CreditNoteActionsClient
            creditNote={{
              id: creditNote.id,
              status: creditNote.status,
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Credit note details */}
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
                  <p className="font-semibold">{creditNote.user.company?.name ?? ""}</p>
                  <p>{creditNote.user.company?.address ?? ""}</p>
                  <p>
                    {creditNote.user.company?.postalCode} {creditNote.user.company?.city}
                  </p>
                  {creditNote.user.vatNumber && (
                    <p className="text-sm text-muted-foreground">
                      BTW: {creditNote.user.vatNumber}
                    </p>
                  )}
                  {creditNote.user.kvkNumber && (
                    <p className="text-sm text-muted-foreground">
                      KvK: {creditNote.user.kvkNumber}
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
                  {creditNote.customer.companyName && (
                    <p className="font-semibold">{creditNote.customer.companyName}</p>
                  )}
                  <p className={!creditNote.customer.companyName ? "font-semibold" : ""}>
                    {creditNote.customer.name}
                  </p>
                  <p>{creditNote.customer.address}</p>
                  <p>
                    {creditNote.customer.postalCode} {creditNote.customer.city}
                  </p>
                  {creditNote.customer.vatNumber && (
                    <p className="text-sm text-muted-foreground">
                      BTW: {creditNote.customer.vatNumber}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit note items */}
          <Card>
            <CardHeader>
              <CardTitle>Credit nota regels</CardTitle>
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
                  {creditNote.items.map((item: typeof creditNote.items[0]) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.vatRate}%
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        -{formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Subtotaal</TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(creditNote.subtotal)}
                    </TableCell>
                  </TableRow>
                  {(Object.entries(vatByRate) as Array<[string, { subtotal: number; vatAmount: number }]>).map(([rate, values]) => (
                    <TableRow key={rate}>
                      <TableCell colSpan={4}>
                        BTW {rate}% over {formatCurrency(values.subtotal)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(values.vatAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4}>Totaal BTW</TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(creditNote.vatAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell colSpan={4}>Credit Totaal</TableCell>
                    <TableCell className="text-right text-red-600">
                      -{formatCurrency(creditNote.total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Description & Notes */}
          {(creditNote.description || creditNote.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Omschrijving & Notities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {creditNote.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Omschrijving</p>
                    <p className="whitespace-pre-wrap">{creditNote.description}</p>
                  </div>
                )}
                {creditNote.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notities</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{creditNote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credit note info */}
          <Card>
            <CardHeader>
              <CardTitle>Credit nota gegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nummer</span>
                <span className="font-medium">{creditNote.creditNoteNumber}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum</span>
                <span>{formatDate(creditNote.creditNoteDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reden</span>
                <span>{CREDIT_NOTE_REASON_LABELS[creditNote.reason] || creditNote.reason}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <CreditNoteStatusBadge status={creditNote.status} />
              </div>
            </CardContent>
          </Card>

          {/* Original Invoice Link */}
          {creditNote.originalInvoice && (
            <Card>
              <CardHeader>
                <CardTitle>Originele factuur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{creditNote.originalInvoice.invoiceNumber}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/facturen/${creditNote.originalInvoice.id}`}>
                      Bekijken
                    </Link>
                  </Button>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Origineel bedrag: {formatCurrency(creditNote.originalInvoice.total)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Total */}
          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Credit bedrag</p>
                <p className="text-3xl font-bold text-red-600">
                  -{formatCurrency(creditNote.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Internal notes */}
          {creditNote.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Interne notities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {creditNote.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
