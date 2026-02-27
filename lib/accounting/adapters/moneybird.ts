import { format } from 'date-fns'
import { LedgerSourceType } from '@prisma/client'
import {
  AccountingSyncError,
  SyncErrorType,
  type AccountingAdapter,
  type Administration,
  type CustomerPayload,
  type CreditNotePayload,
  type ExternalCreditNote,
  type ExternalCustomer,
  type ExternalInvoice,
  type InvoiceLinePayload,
  type InvoicePayload,
  type LedgerAccount,
  type LedgerMapping,
  type TokenResponse,
  type VatCode,
  type VatMapping,
} from '../types'

// ============================================================
// Constants
// ============================================================

const MONEYBIRD_AUTH_URL = 'https://moneybird.com/oauth/authorize'
const MONEYBIRD_TOKEN_URL = 'https://moneybird.com/oauth/token'
const MONEYBIRD_API_URL = 'https://moneybird.com/api/v2'
const SCOPES = ['sales_invoices', 'documents', 'contacts', 'settings']
const CACHE_TTL_MS = 15 * 60 * 1000

// ============================================================
// Runtime Environment Helpers
// ============================================================

function getClientId(): string {
  const id = process.env.MONEYBIRD_CLIENT_ID
  if (!id) throw new Error('MONEYBIRD_CLIENT_ID environment variable is not set')
  return id
}

function getClientSecret(): string {
  const secret = process.env.MONEYBIRD_CLIENT_SECRET
  if (!secret) throw new Error('MONEYBIRD_CLIENT_SECRET environment variable is not set')
  return secret
}

// ============================================================
// Internal Response Shapes
// ============================================================

interface MoneybirdTokenPayload {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

interface MoneybirdAdministration {
  id: string | number
  name: string
  currency?: string
  country?: string
}

interface MoneybirdContact {
  id: number | string
  company_name: string
  firstname: string
  lastname: string
  email: string
  phone: string
  address1?: string
  zipcode?: string
  city?: string
  country?: string
  chamber_of_commerce?: string
  tax_number?: string
}

type MoneybirdContactPayload = Partial<Omit<MoneybirdContact, 'id'>>

interface MoneybirdLedgerAccount {
  id: number | string
  account_id: string
  name: string
  account_type: string
}

interface MoneybirdTaxRate {
  id: number | string
  name: string
  percentage: string
  tax_rate_type: string
}

interface MoneybirdDetailAttribute {
  description: string
  price: string
  amount: string
  tax_rate_id: string | null
  ledger_account_id: string | null
}

interface MoneybirdInvoicePayload {
  contact_id: string
  reference: string
  invoice_date: string
  due_date: string
  currency: string
  prices_are_incl_tax: boolean
  details_attributes: MoneybirdDetailAttribute[]
  credit_invoice_for_id?: string
}

interface MoneybirdInvoice {
  id: number | string
  invoice_id: string
  contact_id: string | number
  reference?: string
  invoice_date: string
  due_date?: string
  state?: string
  currency?: string
}

// ============================================================
// In-memory cache (shared across all MoneybirdAdapter instances)
// ============================================================

const _cache = new Map<string, { data: unknown; expiresAt: number }>()

export function clearCache(adminId?: string): void {
  if (adminId === undefined) {
    _cache.clear()
  } else {
    for (const key of _cache.keys()) {
      if (key.startsWith(`${adminId}:`)) {
        _cache.delete(key)
      }
    }
  }
}

// ============================================================
// Adapter
// ============================================================

export class MoneybirdAdapter implements AccountingAdapter {
  constructor(
    private readonly token: string,
    private readonly adminId: string,
  ) {}

  // -------------------------------------------------------
  // OAuth
  // -------------------------------------------------------

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
    })
    return `${MONEYBIRD_AUTH_URL}?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
    return this.exchangeOAuthTokens(
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: getClientId(),
        client_secret: getClientSecret(),
      }),
    )
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return this.exchangeOAuthTokens(
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: getClientId(),
        client_secret: getClientSecret(),
      }),
    )
  }

  // -------------------------------------------------------
  // Connection / Administrations
  // -------------------------------------------------------

  async getAdministrations(): Promise<Administration[]> {
    const data = await this.makeRequest<MoneybirdAdministration[]>('GET', '/administrations')
    return data.map((a) => ({
      id: String(a.id),
      name: a.name,
      currency: a.currency,
      country: a.country,
    }))
  }

  async validateConnection(): Promise<boolean> {
    try {
      const data = await this.makeRequest<MoneybirdAdministration[]>('GET', '/administrations')
      return Array.isArray(data) && data.length > 0
    } catch {
      return false
    }
  }

  // -------------------------------------------------------
  // Customer methods
  // -------------------------------------------------------

  async createCustomer(customer: CustomerPayload): Promise<ExternalCustomer> {
    const payload: MoneybirdContactPayload = {
      company_name: customer.companyName,
      firstname: customer.firstName,
      lastname: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address1: customer.address,
      zipcode: customer.zipcode,
      city: customer.city,
      country: customer.country,
      chamber_of_commerce: customer.chamberOfCommerce,
      tax_number: customer.taxNumber,
    }
    const response = await this.makeRequest<{ contact: MoneybirdContact }>(
      'POST',
      `/${this.adminId}/contacts`,
      { contact: payload },
    )
    return this.transformContact(response.contact)
  }

  async updateCustomer(externalId: string, customer: CustomerPayload): Promise<ExternalCustomer> {
    const payload: MoneybirdContactPayload = {
      company_name: customer.companyName,
      firstname: customer.firstName,
      lastname: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address1: customer.address,
      zipcode: customer.zipcode,
      city: customer.city,
      country: customer.country,
      chamber_of_commerce: customer.chamberOfCommerce,
      tax_number: customer.taxNumber,
    }
    const response = await this.makeRequest<{ contact: MoneybirdContact }>(
      'PATCH',
      `/${this.adminId}/contacts/${externalId}`,
      { contact: payload },
    )
    return this.transformContact(response.contact)
  }

  async findCustomerByEmail(email: string): Promise<ExternalCustomer | null> {
    const data = await this.makeRequest<MoneybirdContact[]>(
      'GET',
      `/${this.adminId}/contacts?query=${encodeURIComponent(email)}`,
    )
    const match = data.find((c) => c.email === email)
    return match ? this.transformContact(match) : null
  }

  // -------------------------------------------------------
  // Invoice methods
  // -------------------------------------------------------

  async createInvoice(invoice: InvoicePayload): Promise<ExternalInvoice> {
    const payload: MoneybirdInvoicePayload = {
      contact_id: invoice.externalCustomerId,
      reference: invoice.invoiceNumber,
      invoice_date: format(invoice.date, 'yyyy-MM-dd'),
      due_date: format(invoice.dueDate, 'yyyy-MM-dd'),
      currency: 'EUR',
      prices_are_incl_tax: false,
      details_attributes: invoice.items.map((item) => ({
        description: item.description,
        price: item.unitPrice.toString(),
        amount: item.quantity.toString(),
        tax_rate_id: this.getVatMapping(item.vatRate, invoice.vatMappings)?.externalVatId ?? null,
        ledger_account_id: this.getLedgerMapping(item, invoice.ledgerMappings)?.externalLedgerId ?? null,
      })),
    }
    const response = await this.makeRequest<{ sales_invoice: MoneybirdInvoice }>(
      'POST',
      `/${this.adminId}/sales_invoices`,
      { sales_invoice: payload },
    )
    const res = response.sales_invoice
    return {
      id: String(res.id),
      invoiceNumber: res.invoice_id,
      externalUrl: `https://moneybird.com/${this.adminId}/sales_invoices/${res.id}`,
    }
  }

  async updateInvoiceStatus(externalId: string, status: string): Promise<void> {
    if (status === 'PAID') {
      await this.makeRequest(
        'POST',
        `/${this.adminId}/sales_invoices/${externalId}/register_payment`,
        {
          payment: {
            price_base: 'invoice_total_price_incl_tax',
            payment_date: format(new Date(), 'yyyy-MM-dd'),
          },
        },
      )
    } else if (status === 'SENT') {
      await this.makeRequest(
        'POST',
        `/${this.adminId}/sales_invoices/${externalId}/send_invoice`,
        { sales_invoice: { sending_method: 'email' } },
      )
    } else {
      await this.makeRequest(
        'PATCH',
        `/${this.adminId}/sales_invoices/${externalId}`,
        { sales_invoice: { state: status.toLowerCase() } },
      )
    }
  }

  async createCreditNote(creditNote: CreditNotePayload): Promise<ExternalCreditNote> {
    const payload: MoneybirdInvoicePayload & { credit_invoice_for_id?: string } = {
      contact_id: creditNote.externalCustomerId,
      reference: creditNote.creditNoteNumber,
      invoice_date: format(creditNote.date, 'yyyy-MM-dd'),
      due_date: format(creditNote.date, 'yyyy-MM-dd'),
      currency: 'EUR',
      prices_are_incl_tax: false,
      details_attributes: creditNote.items.map((item) => ({
        description: item.description,
        price: item.unitPrice.toString(),
        amount: item.quantity.toString(),
        tax_rate_id: this.getVatMapping(item.vatRate, creditNote.vatMappings)?.externalVatId ?? null,
        ledger_account_id: this.getLedgerMapping(item, creditNote.ledgerMappings)?.externalLedgerId ?? null,
      })),
      ...(creditNote.originalInvoiceExternalId
        ? { credit_invoice_for_id: creditNote.originalInvoiceExternalId }
        : {}),
    }
    const response = await this.makeRequest<{ sales_invoice: MoneybirdInvoice }>(
      'POST',
      `/${this.adminId}/sales_invoices`,
      { sales_invoice: payload },
    )
    const res = response.sales_invoice
    return {
      id: String(res.id),
      externalUrl: `https://moneybird.com/${this.adminId}/sales_invoices/${res.id}`,
    }
  }

  // -------------------------------------------------------
  // Metadata methods
  // -------------------------------------------------------

  private static readonly REVENUE_TYPES = new Set(['revenue', 'other_income', 'income'])

  async getLedgerAccounts(): Promise<LedgerAccount[]> {
    const key = `${this.adminId}:ledgers`
    const cached = this.getCached<LedgerAccount[]>(key)
    if (cached) return cached

    const data = await this.makeRequest<MoneybirdLedgerAccount[]>(
      'GET',
      `/${this.adminId}/ledger_accounts`,
    )
    const result = data
      .filter((a) => MoneybirdAdapter.REVENUE_TYPES.has(a.account_type))
      .map((a) => ({
        id: String(a.id),
        code: a.account_id,
        name: a.name,
        accountType: a.account_type,
      }))
    this.setCache(key, result)
    return result
  }

  async getVatCodes(): Promise<VatCode[]> {
    const key = `${this.adminId}:vatcodes`
    const cached = this.getCached<VatCode[]>(key)
    if (cached) return cached

    const data = await this.makeRequest<MoneybirdTaxRate[]>(
      'GET',
      `/${this.adminId}/tax_rates`,
    )
    const result = data
      .filter((a) => a.tax_rate_type === 'sales_invoice')
      .map((a) => ({
        id: String(a.id),
        name: a.name,
        percentage: parseFloat(a.percentage),
        taxRateType: a.tax_rate_type,
      }))
    this.setCache(key, result)
    return result
  }

  // -------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------

  private getCached<T>(key: string): T | null {
    const entry = _cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) return null
    return entry.data as T
  }

  private setCache(key: string, data: unknown): void {
    _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  }

  private getVatMapping(vatRate: number, mappings: VatMapping[]): VatMapping | undefined {
    return mappings.find((m) => Number(m.vatRate) === vatRate)
  }

  private getLedgerMapping(item: InvoiceLinePayload, mappings: LedgerMapping[]): LedgerMapping | undefined {
    if (item.productId) {
      const match = mappings.find(
        (m) => m.sourceType === LedgerSourceType.PRODUCT && m.sourceId === item.productId,
      )
      if (match) return match
    }
    if (item.categoryId) {
      const match = mappings.find(
        (m) => m.sourceType === LedgerSourceType.PRODUCT_CATEGORY && m.sourceId === item.categoryId,
      )
      if (match) return match
    }
    return mappings.find((m) => m.sourceType === LedgerSourceType.DEFAULT)
  }

  private transformContact(contact: MoneybirdContact): ExternalCustomer {
    const name =
      contact.company_name ||
      [contact.firstname, contact.lastname].filter(Boolean).join(' ').trim()
    return {
      id: String(contact.id),
      name,
      email: contact.email,
      externalUrl: `https://moneybird.com/${this.adminId}/contacts/${contact.id}`,
    }
  }

  /**
   * Shared handler for both authorization_code and refresh_token grant types.
   */
  private async exchangeOAuthTokens(params: URLSearchParams): Promise<TokenResponse> {
    let response: Response
    try {
      response = await fetch(MONEYBIRD_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
    } catch (error) {
      throw new AccountingSyncError(
        'Network request to Moneybird OAuth endpoint failed',
        SyncErrorType.NETWORK_ERROR,
        { cause: error },
      )
    }

    const payload = await response.json() as MoneybirdTokenPayload

    if (!response.ok) {
      throw new AccountingSyncError(
        `Moneybird token exchange failed: ${payload.error_description ?? payload.error ?? response.statusText}`,
        SyncErrorType.AUTHENTICATION_FAILED,
        { statusCode: response.status },
      )
    }

    const expiresIn = payload.expires_in
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn,
      expiresAt: expiresIn !== undefined ? new Date(Date.now() + expiresIn * 1000) : undefined,
    }
  }

  /**
   * Sends an authenticated request to the Moneybird REST API.
   * Handles all documented error status codes and maps them to AccountingSyncError.
   */
  private async makeRequest<T = unknown>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${MONEYBIRD_API_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (error) {
      throw new AccountingSyncError(
        'Network request to Moneybird API failed',
        SyncErrorType.NETWORK_ERROR,
        { cause: error },
      )
    }

    if (response.status === 401) {
      throw new AccountingSyncError(
        'Moneybird authentication failed: invalid or expired access token',
        SyncErrorType.AUTHENTICATION_FAILED,
        { statusCode: 401 },
      )
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After')
      const retryAfterSecs = retryAfterHeader !== null ? parseInt(retryAfterHeader, 10) : undefined
      throw new AccountingSyncError(
        'Moneybird rate limit exceeded',
        SyncErrorType.RATE_LIMITED,
        {
          statusCode: 429,
          retryAfter: retryAfterSecs !== undefined && !Number.isNaN(retryAfterSecs)
            ? retryAfterSecs
            : undefined,
        },
      )
    }

    if (response.status === 422) {
      const providerResponse = await response.json().catch(() => undefined)
      throw new AccountingSyncError(
        'Moneybird rejected the request due to a validation error',
        SyncErrorType.VALIDATION_ERROR,
        { statusCode: 422, providerResponse },
      )
    }

    if (response.status >= 500) {
      throw new AccountingSyncError(
        `Moneybird server error (HTTP ${response.status})`,
        SyncErrorType.PROVIDER_ERROR,
        { statusCode: response.status },
      )
    }

    // 204 No Content — successful but no body (e.g. DELETE)
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }
}
