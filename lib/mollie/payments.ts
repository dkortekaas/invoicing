import { db } from "@/lib/db"
import { createMollieClientFromInvoice, MollieClient } from "./client"
import type {
  CreatePaymentInput,
  CreatePaymentResponse,
  PaymentStatusResult,
  MolliePaymentStatus,
  MollieIssuer,
} from "./types"
import { randomBytes } from "crypto"
import { Prisma } from "@prisma/client"
const Decimal = Prisma.Decimal

/**
 * Generate a unique payment link token
 */
export function generatePaymentLinkToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Create a payment link for an invoice
 * Sets the paymentLinkToken and expiration on the invoice
 */
export async function createPaymentLink(
  invoiceId: string,
  expirationDays: number = 30
): Promise<{ token: string; expiresAt: Date }> {
  const token = generatePaymentLinkToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expirationDays)

  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      paymentLinkToken: token,
      paymentLinkExpiresAt: expiresAt,
    },
  })

  return { token, expiresAt }
}

/**
 * Get invoice by payment link token
 */
export async function getInvoiceByPaymentToken(token: string) {
  return db.invoice.findUnique({
    where: { paymentLinkToken: token },
    include: {
      customer: true,
      user: {
        select: {
          companyName: true,
          companyEmail: true,
          companyPhone: true,
          companyAddress: true,
          companyCity: true,
          companyPostalCode: true,
          iban: true,
          mollieEnabled: true,
        },
      },
      items: {
        orderBy: { sortOrder: "asc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
}

/**
 * Check if a payment link is valid and not expired
 */
export function isPaymentLinkValid(invoice: {
  paymentLinkToken: string | null
  paymentLinkExpiresAt: Date | null
  status: string
}): { valid: boolean; reason?: string } {
  if (!invoice.paymentLinkToken) {
    return { valid: false, reason: "no_link" }
  }

  if (invoice.paymentLinkExpiresAt && new Date() > invoice.paymentLinkExpiresAt) {
    return { valid: false, reason: "expired" }
  }

  if (invoice.status === "PAID") {
    return { valid: false, reason: "already_paid" }
  }

  if (invoice.status === "CANCELLED") {
    return { valid: false, reason: "cancelled" }
  }

  return { valid: true }
}

/**
 * Format amount for Mollie (requires string with 2 decimal places)
 */
function formatMollieAmount(amount: Prisma.Decimal | number): string {
  const num = typeof amount === "number" ? amount : Number(amount)
  return num.toFixed(2)
}

/**
 * Create a Mollie payment for an invoice
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResponse> {
  const client = await createMollieClientFromInvoice(input.invoiceId)

  if (!client) {
    return {
      success: false,
      error: "Mollie is niet geconfigureerd voor deze gebruiker",
    }
  }

  try {
    const paymentParams: Record<string, unknown> = {
      amount: {
        currency: "EUR",
        value: formatMollieAmount(input.amount),
      },
      description: input.description,
      redirectUrl: input.redirectUrl,
      webhookUrl: input.webhookUrl,
      metadata: {
        invoiceId: input.invoiceId,
        ...input.metadata,
      },
      locale: input.locale || "nl_NL",
    }

    if (input.method) {
      paymentParams.method = input.method
    }

    if (input.issuer) {
      paymentParams.issuer = input.issuer
    }

    const response = await client.createPayment(paymentParams as Parameters<MollieClient["createPayment"]>[0])

    // Store payment in database
    const payment = await db.payment.create({
      data: {
        invoiceId: input.invoiceId,
        molliePaymentId: response.id,
        mollieStatus: response.status,
        amount: new Decimal(formatMollieAmount(input.amount)),
        currency: "EUR",
        method: response.method || null,
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : null,
        metadata: response.metadata 
          ? (response.metadata as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    })

    // Log payment created event
    await db.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: "PAYMENT_CREATED",
        mollieStatus: response.status,
        metadata: { molliePaymentId: response.id },
      },
    })

    return {
      success: true,
      paymentId: payment.id,
      molliePaymentId: response.id,
      checkoutUrl: response._links.checkout?.href || "",
      expiresAt: response.expiresAt,
    }
  } catch (error) {
    const err = error as Error & { mollieError?: { title?: string; detail?: string } }
    console.error("Mollie payment creation failed:", err)
    return {
      success: false,
      error: err.mollieError?.detail || err.message || "Betaling aanmaken mislukt",
    }
  }
}

/**
 * Get payment status from Mollie
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResult | null> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        select: { userId: true },
      },
    },
  })

  if (!payment) {
    return null
  }

  const client = await createMollieClientFromInvoice(payment.invoiceId)
  if (!client) {
    return null
  }

  try {
    const response = await client.getPayment(payment.molliePaymentId)

    return {
      status: response.status,
      isPaid: response.status === "paid",
      isFailed: response.status === "failed",
      isExpired: response.status === "expired",
      isCanceled: response.status === "canceled",
      isOpen: response.status === "open" || response.status === "pending",
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
      method: response.method,
      consumerName: response.details?.consumerName,
      consumerAccount: response.details?.consumerAccount,
    }
  } catch (error) {
    console.error("Failed to get payment status:", error)
    return null
  }
}

/**
 * Sync payment status from Mollie and update local database
 */
export async function syncPaymentStatus(paymentId: string): Promise<boolean> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  })

  if (!payment) {
    return false
  }

  const client = await createMollieClientFromInvoice(payment.invoiceId)
  if (!client) {
    return false
  }

  try {
    const response = await client.getPayment(payment.molliePaymentId)

    // Update payment record
    await db.payment.update({
      where: { id: paymentId },
      data: {
        mollieStatus: response.status,
        method: response.method || payment.method,
        paidAt: response.paidAt ? new Date(response.paidAt) : null,
        consumerName: response.details?.consumerName,
        consumerAccount: response.details?.consumerAccount,
      },
    })

    // Update invoice if payment is successful
    if (response.status === "paid" && payment.invoice.status !== "PAID") {
      await db.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: "PAID",
          paidAt: response.paidAt ? new Date(response.paidAt) : new Date(),
        },
      })
    }

    return true
  } catch (error) {
    console.error("Failed to sync payment status:", error)
    return false
  }
}

/**
 * Get iDEAL issuers (banks) for a user
 */
export async function getIdealIssuers(userId: string): Promise<MollieIssuer[]> {
  const { createMollieClient } = await import("./client")
  const client = await createMollieClient(userId)

  if (!client) {
    return []
  }

  try {
    const issuers = await client.getIdealIssuers()
    return issuers.map((issuer) => ({
      id: issuer.id,
      name: issuer.name,
      image: issuer.image,
    }))
  } catch (error) {
    console.error("Failed to get iDEAL issuers:", error)
    return []
  }
}

/**
 * Get payments for an invoice
 */
export async function getInvoicePayments(invoiceId: string) {
  return db.payment.findMany({
    where: { invoiceId },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Map Mollie status to event type
 */
export function statusToEventType(status: MolliePaymentStatus): "PAYMENT_PAID" | "PAYMENT_FAILED" | "PAYMENT_CANCELED" | "PAYMENT_EXPIRED" | "WEBHOOK_RECEIVED" {
  switch (status) {
    case "paid":
      return "PAYMENT_PAID"
    case "failed":
      return "PAYMENT_FAILED"
    case "canceled":
      return "PAYMENT_CANCELED"
    case "expired":
      return "PAYMENT_EXPIRED"
    default:
      return "WEBHOOK_RECEIVED"
  }
}
