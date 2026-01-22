"use server"

import { db } from "@/lib/db"
import { getInvoiceByPaymentToken, isPaymentLinkValid, createPayment } from "@/lib/mollie/payments"
import { getIdealIssuers } from "@/lib/mollie/payments"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function getPaymentPageData(token: string) {
  const invoice = await getInvoiceByPaymentToken(token)

  if (!invoice) {
    return { found: false as const, reason: "not_found" }
  }

  const validity = isPaymentLinkValid(invoice)
  if (!validity.valid) {
    return { found: false as const, reason: validity.reason }
  }

  // Check if Mollie is enabled for the user
  if (!invoice.user.mollieEnabled) {
    return { found: false as const, reason: "mollie_disabled" }
  }

  // Check for pending payment
  const firstPayment = invoice.payments[0]
  const pendingPayment = firstPayment &&
    ["open", "pending"].includes(firstPayment.mollieStatus)

  return {
    found: true as const,
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      dueDate: invoice.dueDate,
      status: invoice.status,
      customer: {
        name: invoice.customer.name,
        companyName: invoice.customer.companyName,
      },
      issuer: {
        companyName: invoice.user.companyName,
        companyEmail: invoice.user.companyEmail,
        iban: invoice.user.iban,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: item.total,
      })),
    },
    pendingPayment: pendingPayment && firstPayment ? {
      id: firstPayment.id,
      status: firstPayment.mollieStatus,
    } : null,
  }
}

export async function getAvailableIssuers(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { userId: true },
  })

  if (!invoice) {
    return []
  }

  return getIdealIssuers(invoice.userId)
}

export async function initiatePayment(
  token: string,
  issuer?: string
): Promise<{ success: true; checkoutUrl: string } | { success: false; error: string }> {
  const invoice = await getInvoiceByPaymentToken(token)

  if (!invoice) {
    return { success: false, error: "Factuur niet gevonden" }
  }

  const validity = isPaymentLinkValid(invoice)
  if (!validity.valid) {
    if (validity.reason === "expired") {
      return { success: false, error: "Betaallink is verlopen" }
    }
    if (validity.reason === "already_paid") {
      return { success: false, error: "Deze factuur is al betaald" }
    }
    return { success: false, error: "Betaallink is niet geldig" }
  }

  const result = await createPayment({
    invoiceId: invoice.id,
    amount: invoice.total,
    description: `Factuur ${invoice.invoiceNumber}`,
    redirectUrl: `${APP_URL}/pay/${token}/complete`,
    webhookUrl: `${APP_URL}/api/mollie/webhook`,
    issuer,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
    },
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, checkoutUrl: result.checkoutUrl }
}
