import type { LedgerMapping, VatMapping } from '@prisma/client'

export type { LedgerMapping, VatMapping }

// ============================================================
// Token & Connection Types
// ============================================================

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  /** Lifetime in seconds as returned by the provider */
  expiresIn?: number
  /** Absolute expiry timestamp (preferred over expiresIn for storage) */
  expiresAt?: Date
}

export interface Administration {
  id: string
  name: string
  currency?: string
  country?: string
}

// ============================================================
// External Entity Types (returned by the provider)
// ============================================================

export interface ExternalCustomer {
  id: string
  name: string
  email?: string
  externalUrl?: string
}

export interface ExternalInvoice {
  id: string
  invoiceNumber?: string
  externalUrl?: string
}

export interface ExternalCreditNote {
  id: string
  externalUrl?: string
}

export interface LedgerAccount {
  id: string
  code?: string
  name: string
  accountType?: string
}

export interface VatCode {
  id: string
  name: string
  percentage: number
  taxRateType?: string
}

// ============================================================
// Payload Types (sent to the provider)
// ============================================================

export interface CustomerPayload {
  companyName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  zipcode?: string
  city?: string
  country?: string
  chamberOfCommerce?: string
  taxNumber?: string
}

export interface InvoiceLinePayload {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  productId?: string
  categoryId?: string
}

export interface InvoicePayload {
  invoiceNumber: string
  date: Date
  dueDate: Date
  customer: CustomerPayload
  externalCustomerId: string
  items: InvoiceLinePayload[]
  vatMappings: VatMapping[]
  ledgerMappings: LedgerMapping[]
}

export interface CreditNotePayload {
  creditNoteNumber: string
  date: Date
  originalInvoiceExternalId?: string
  customer: CustomerPayload
  externalCustomerId: string
  items: InvoiceLinePayload[]
  vatMappings: VatMapping[]
  ledgerMappings: LedgerMapping[]
}

// ============================================================
// Adapter Interface
// ============================================================

export interface AccountingAdapter {
  // OAuth flow
  getAuthUrl(redirectUri: string, state: string): string
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse>
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>

  // Connection management
  getAdministrations(): Promise<Administration[]>
  validateConnection(): Promise<boolean>

  // Customer sync
  createCustomer(customer: CustomerPayload): Promise<ExternalCustomer>
  updateCustomer(externalId: string, customer: CustomerPayload): Promise<ExternalCustomer>
  findCustomerByEmail(email: string): Promise<ExternalCustomer | null>

  // Invoice sync
  createInvoice(invoice: InvoicePayload): Promise<ExternalInvoice>
  updateInvoiceStatus(externalId: string, status: string): Promise<void>

  // Credit note sync
  createCreditNote(creditNote: CreditNotePayload): Promise<ExternalCreditNote>

  // Mapping helpers
  getLedgerAccounts(): Promise<LedgerAccount[]>
  getVatCodes(): Promise<VatCode[]>
}

// ============================================================
// Error Types
// ============================================================

export enum SyncErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class AccountingSyncError extends Error {
  readonly errorType: SyncErrorType
  readonly statusCode?: number
  readonly providerResponse?: unknown
  /** Seconds to wait before retrying (populated when errorType === RATE_LIMITED) */
  readonly retryAfter?: number

  constructor(
    message: string,
    errorType: SyncErrorType,
    options?: {
      statusCode?: number
      providerResponse?: unknown
      retryAfter?: number
      cause?: unknown
    }
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'AccountingSyncError'
    this.errorType = errorType
    this.statusCode = options?.statusCode
    this.providerResponse = options?.providerResponse
    this.retryAfter = options?.retryAfter
  }
}
