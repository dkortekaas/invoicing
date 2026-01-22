import { db } from "@/lib/db"
import { createMollieClientFromInvoice } from "./client"
import { statusToEventType } from "./payments"
import type { MolliePaymentResponse, MolliePaymentStatus } from "./types"

/**
 * Handle Mollie webhook callback
 * Mollie sends a POST with { id: "tr_xxx" } when payment status changes
 */
export async function handlePaymentWebhook(molliePaymentId: string): Promise<{
  success: boolean
  action?: string
  error?: string
}> {
  // Find the payment in our database
  const payment = await db.payment.findUnique({
    where: { molliePaymentId },
    include: {
      invoice: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!payment) {
    console.log(`[Webhook] Payment not found: ${molliePaymentId}`)
    return { success: false, error: "Payment not found" }
  }

  // Log webhook received event
  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType: "WEBHOOK_RECEIVED",
      mollieStatus: payment.mollieStatus,
      metadata: { molliePaymentId },
    },
  })

  // Get current payment status from Mollie (verify the webhook)
  const client = await createMollieClientFromInvoice(payment.invoiceId)
  if (!client) {
    return { success: false, error: "Mollie not configured" }
  }

  let molliePayment: MolliePaymentResponse
  try {
    molliePayment = await client.getPayment(molliePaymentId)
  } catch (error) {
    console.error(`[Webhook] Failed to fetch payment from Mollie:`, error)
    return { success: false, error: "Failed to verify payment with Mollie" }
  }

  const previousStatus = payment.mollieStatus
  const newStatus = molliePayment.status

  // No status change
  if (previousStatus === newStatus) {
    return { success: true, action: "no_change" }
  }

  // Update payment record
  await db.payment.update({
    where: { id: payment.id },
    data: {
      mollieStatus: newStatus,
      method: molliePayment.method || payment.method,
      paidAt: molliePayment.paidAt ? new Date(molliePayment.paidAt) : null,
      consumerName: molliePayment.details?.consumerName || null,
      consumerAccount: molliePayment.details?.consumerAccount || null,
    },
  })

  // Log status change event
  const eventType = statusToEventType(newStatus as MolliePaymentStatus)
  await db.paymentEvent.create({
    data: {
      paymentId: payment.id,
      eventType,
      mollieStatus: newStatus,
      metadata: {
        previousStatus,
        method: molliePayment.method,
        paidAt: molliePayment.paidAt,
      },
    },
  })

  // Handle specific status changes
  if (newStatus === "paid") {
    await handlePaymentPaid(payment.id, payment.invoice, molliePayment)
    return { success: true, action: "marked_paid" }
  }

  if (newStatus === "failed" || newStatus === "canceled" || newStatus === "expired") {
    // Payment failed - no action needed on invoice
    return { success: true, action: `payment_${newStatus}` }
  }

  return { success: true, action: "status_updated" }
}

/**
 * Handle successful payment
 */
async function handlePaymentPaid(
  _paymentId: string,
  invoice: {
    id: string
    invoiceNumber: string
    status: string
    user: { id: string; email: string }
    customer: { name: string; email: string }
  },
  molliePayment: MolliePaymentResponse
) {
  // Only update if invoice is not already paid
  if (invoice.status !== "PAID") {
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: molliePayment.paidAt ? new Date(molliePayment.paidAt) : new Date(),
      },
    })

    // Log audit trail for payment
    try {
      const { logPaymentRecorded } = await import("@/lib/audit/helpers")
      await logPaymentRecorded(
        invoice.id,
        parseFloat(molliePayment.amount.value),
        invoice.user.id
      )
    } catch (error) {
      console.error("[Webhook] Failed to log audit:", error)
    }

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail(invoice, molliePayment)
    } catch (error) {
      console.error("[Webhook] Failed to send confirmation email:", error)
    }
  }
}

/**
 * Send payment confirmation email
 */
async function sendPaymentConfirmationEmail(
  invoice: {
    id: string
    invoiceNumber: string
    user: { id: string; email: string }
    customer: { name: string; email: string }
  },
  _molliePayment: MolliePaymentResponse
) {
  // Check if user has auto-send payment confirm enabled
  const emailSettings = await db.emailSettings.findUnique({
    where: { userId: invoice.user.id },
  })

  if (!emailSettings?.autoSendPaymentConfirm) {
    return
  }

  // TODO: Implement email sending via the existing email system
  // This would use the payment-received-email template
  console.log(`[Webhook] Would send payment confirmation for ${invoice.invoiceNumber} to ${invoice.customer.email}`)
}
