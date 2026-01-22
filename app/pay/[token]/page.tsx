import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getPaymentPageData } from "./actions"
import { PaymentForm } from "./payment-form"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Building2, Calendar, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Factuur betalen",
  description: "Betaal je factuur veilig met iDEAL",
}

interface PaymentPageProps {
  params: Promise<{ token: string }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { token } = await params
  const data = await getPaymentPageData(token)

  if (!data.found) {
    if (data.reason === "expired") {
      redirect("/pay/expired")
    }
    if (data.reason === "already_paid") {
      redirect("/pay/success?already=true")
    }
    notFound()
  }

  const { invoice, pendingPayment } = data

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Factuur betalen</h1>
          <p className="text-muted-foreground mt-1">
            Betaal veilig met iDEAL
          </p>
        </div>

        {/* Invoice Summary Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {invoice.issuer.companyName}
                </CardDescription>
                <CardTitle className="text-lg mt-1">
                  Factuur {invoice.invoiceNumber}
                </CardTitle>
              </div>
              <Badge variant="outline" className="shrink-0">
                <FileText className="h-3 w-3 mr-1" />
                {invoice.status === "SENT" ? "Openstaand" : invoice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer */}
            <div className="text-sm">
              <span className="text-muted-foreground">Aan: </span>
              <span className="font-medium">
                {invoice.customer.companyName || invoice.customer.name}
              </span>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Vervaldatum:</span>
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Factuurregels</p>
              {invoice.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate max-w-[200px]">{item.description}</span>
                  <span className="font-medium">{formatCurrency(Number(item.total))}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Te betalen</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(Number(invoice.total))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <PaymentForm
          token={token}
          invoiceId={invoice.id}
          amount={Number(invoice.total)}
          pendingPayment={pendingPayment}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Betalingen worden veilig verwerkt via{" "}
            <a
              href="https://www.mollie.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Mollie
            </a>
          </p>
          <p className="mt-1">
            Vragen? Neem contact op met{" "}
            <a
              href={`mailto:${invoice.issuer.companyEmail}`}
              className="underline hover:text-primary"
            >
              {invoice.issuer.companyEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
