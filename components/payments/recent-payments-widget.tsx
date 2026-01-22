import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentStatusBadge } from "./payment-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CreditCard } from "lucide-react"

interface Payment {
  id: string
  mollieStatus: string
  amount: number | { toNumber(): number }
  method: string | null
  paidAt: Date | null
  createdAt: Date
  invoice: {
    id: string
    invoiceNumber: string
    customer: {
      name: string
      companyName: string | null
    }
  }
}

interface RecentPaymentsWidgetProps {
  payments: Payment[]
}

export function RecentPaymentsWidget({ payments }: RecentPaymentsWidgetProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recente betalingen
          </CardTitle>
          <CardDescription>
            Betalingen via Mollie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nog geen betalingen ontvangen via Mollie
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recente betalingen
          </CardTitle>
          <CardDescription>
            Laatste {payments.length} betalingen via Mollie
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => {
            const amount = typeof payment.amount === "number"
              ? payment.amount
              : payment.amount.toNumber()

            return (
              <Link
                key={payment.id}
                href={`/facturen/${payment.invoice.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {payment.invoice.customer.companyName || payment.invoice.customer.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {payment.invoice.invoiceNumber}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-medium text-sm">
                      {formatCurrency(amount)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {payment.paidAt
                        ? formatDate(payment.paidAt)
                        : formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={payment.mollieStatus} size="sm" />
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
