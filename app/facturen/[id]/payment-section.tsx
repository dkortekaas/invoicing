"use client"

import { PaymentLinkGenerator } from "@/components/payments/payment-link-generator"
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generatePaymentLink } from "../actions"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CreditCard } from "lucide-react"

interface Payment {
  id: string
  mollieStatus: string
  amount: number
  method: string | null
  paidAt: Date | null
  createdAt: Date
  consumerName: string | null
}

interface PaymentSectionProps {
  invoiceId: string
  invoiceNumber: string
  invoiceStatus: string
  paymentLinkToken: string | null
  paymentLinkExpiresAt: Date | null
  mollieEnabled: boolean
  payments: Payment[]
}

export function PaymentSection({
  invoiceId,
  invoiceNumber,
  invoiceStatus,
  paymentLinkToken,
  paymentLinkExpiresAt,
  mollieEnabled,
  payments,
}: PaymentSectionProps) {
  // Don't show payment section for paid or cancelled invoices
  if (invoiceStatus === "PAID" || invoiceStatus === "CANCELLED") {
    // But show payment history if there are payments
    if (payments.length > 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Betalingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentHistory payments={payments} />
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <PaymentLinkGenerator
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        currentToken={paymentLinkToken}
        expiresAt={paymentLinkExpiresAt}
        mollieEnabled={mollieEnabled}
        onGenerateLink={generatePaymentLink}
      />

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Betaalgeschiedenis</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentHistory payments={payments} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PaymentHistory({ payments }: { payments: Payment[] }) {
  return (
    <div className="space-y-3">
      {payments.map((payment) => {
        return (
          <div
            key={payment.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PaymentStatusBadge status={payment.mollieStatus} size="sm" />
                {payment.method && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {payment.method}
                  </span>
                )}
              </div>
              {payment.consumerName && (
                <p className="text-xs text-muted-foreground">
                  {payment.consumerName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.paidAt || payment.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
