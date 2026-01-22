import type { Prisma } from "@prisma/client"
type Decimal = Prisma.Decimal

/**
 * Mollie payment status values
 * @see https://docs.mollie.com/reference/payment-statuses
 */
export type MolliePaymentStatus =
  | "open"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "canceled"
  | "expired"

/**
 * Mollie payment methods
 */
export type MolliePaymentMethod =
  | "ideal"
  | "bancontact"
  | "creditcard"
  | "paypal"
  | "sofort"
  | "eps"
  | "giropay"
  | "przelewy24"
  | "belfius"
  | "kbc"
  | "banktransfer"
  | string // Allow other methods

/**
 * iDEAL issuer (bank)
 */
export interface MollieIssuer {
  id: string
  name: string
  image?: {
    size1x?: string
    size2x?: string
    svg?: string
  }
}

/**
 * Mollie amount object
 */
export interface MollieAmount {
  currency: string
  value: string // Mollie uses string for precise decimal values
}

/**
 * Mollie payment details in API response
 */
export interface MolliePaymentDetails {
  consumerName?: string
  consumerAccount?: string // IBAN
  consumerBic?: string
  cardHolder?: string
  cardNumber?: string
  cardFingerprint?: string
  cardSecurity?: string
  feeRegion?: string
}

/**
 * Mollie payment response from API
 */
export interface MolliePaymentResponse {
  resource: "payment"
  id: string
  mode: "test" | "live"
  createdAt: string
  amount: MollieAmount
  description: string
  method?: MolliePaymentMethod
  metadata?: Record<string, unknown>
  status: MolliePaymentStatus
  isCancelable?: boolean
  expiresAt?: string
  paidAt?: string
  canceledAt?: string
  failedAt?: string
  expiredAt?: string
  details?: MolliePaymentDetails
  profileId: string
  sequenceType: "oneoff" | "first" | "recurring"
  redirectUrl: string
  webhookUrl?: string
  _links: {
    self: { href: string }
    checkout?: { href: string }
    dashboard?: { href: string }
    documentation?: { href: string }
  }
}

/**
 * Input for creating a Mollie payment
 */
export interface CreatePaymentInput {
  invoiceId: string
  amount: Decimal | number
  description: string
  redirectUrl: string
  webhookUrl: string
  metadata?: Record<string, unknown>
  method?: MolliePaymentMethod | MolliePaymentMethod[]
  issuer?: string // For iDEAL: bank issuer ID
  locale?: string
}

/**
 * Result of creating a payment
 */
export interface CreatePaymentResult {
  success: true
  paymentId: string
  molliePaymentId: string
  checkoutUrl: string
  expiresAt?: string
}

export interface CreatePaymentError {
  success: false
  error: string
  code?: string
}

export type CreatePaymentResponse = CreatePaymentResult | CreatePaymentError

/**
 * Payment status check result
 */
export interface PaymentStatusResult {
  status: MolliePaymentStatus
  isPaid: boolean
  isFailed: boolean
  isExpired: boolean
  isCanceled: boolean
  isOpen: boolean
  paidAt?: Date
  method?: MolliePaymentMethod
  consumerName?: string
  consumerAccount?: string
}

/**
 * Mollie webhook payload
 */
export interface MollieWebhookPayload {
  id: string // Payment ID
}

/**
 * User's Mollie configuration
 */
export interface MollieConfig {
  apiKey: string
  profileId?: string
  testMode: boolean
}

/**
 * Invoice payment data for public payment page
 */
export interface InvoicePaymentData {
  invoiceNumber: string
  customerName: string
  companyName?: string
  total: Decimal
  currency: string
  dueDate: Date
  status: string
  issuerCompanyName: string
  issuerCompanyEmail: string
  paymentLinkExpiresAt?: Date
}

/**
 * Mollie API error response
 */
export interface MollieApiError {
  status: number
  title: string
  detail: string
  field?: string
  _links?: {
    documentation?: { href: string }
  }
}
