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

const EXACT_NL_BASE     = 'https://start.exactonline.nl'
const EXACT_AUTH_URL    = `${EXACT_NL_BASE}/api/oauth2/auth`
const EXACT_TOKEN_URL   = `${EXACT_NL_BASE}/api/oauth2/token`
const EXACT_API_URL     = `${EXACT_NL_BASE}/api/v1`

/** Exact Online tokens expire after exactly 10 minutes */
const TOKEN_LIFETIME_SECONDS = 600

const CACHE_TTL_MS = 15 * 60 * 1000

// ============================================================
// Runtime Environment Helpers
// ============================================================

function getClientId(): string {
  const id = process.env.EXACT_CLIENT_ID
  if (!id) throw new Error('EXACT_CLIENT_ID environment variable is not set')
  return id
}

function getClientSecret(): string {
  const secret = process.env.EXACT_CLIENT_SECRET
  if (!secret) throw new Error('EXACT_CLIENT_SECRET environment variable is not set')
  return secret
}

// ============================================================
// Internal Response Shapes
// ============================================================

/** OData v3 collection envelope used by all Exact Online list endpoints */
interface ODataCollection<T> {
  d: { results: T[]; __next?: string }
}

/** OData v3 single-entity envelope used by POST/PUT responses */
interface ODataSingle<T> {
  d: T
}

interface ExactTokenPayload {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

interface ExactMe {
  CurrentDivision: number
  Email?: string
  FullName?: string
}

interface ExactDivision {
  Code: number
  Description: string
  Currency?: string
  Country?: string
}

interface ExactAccount {
  ID: string
  Name?: string
  Email?: string
  Phone?: string
  AddressLine1?: string
  Postcode?: string
  City?: string
  Country?: string
  ChamberOfCommerce?: string
  VATNumber?: string
}

interface ExactSalesInvoiceLine {
  Description: string
  Quantity: number
  UnitPrice: number
  VATCode?: string | null
  GLAccount?: string | null
}

interface ExactSalesInvoicePayload {
  OrderedBy: string
  YourRef?: string
  InvoiceDate?: string
  DueDate?: string
  Description?: string
  /** 20 = normal invoice, 21 = credit note */
  Type?: number
  SalesInvoiceLines: { results: ExactSalesInvoiceLine[] }
}

interface ExactSalesInvoiceResponse {
  InvoiceID: string
  InvoiceNumber: number
}

interface ExactGLAccount {
  ID: string
  Code: string
  Description: string
  Type?: number
}

interface ExactVATCode {
  ID: string
  Code: string
  Description: string
  VATPercentage?: number
  Type?: string
}

// ============================================================
// In-memory cache (shared across all ExactAdapter instances)
// ============================================================

const _cache = new Map<string, { data: unknown; expiresAt: number }>()

export function clearCache(division?: string): void {
  if (division === undefined) {
    _cache.clear()
  } else {
    for (const key of _cache.keys()) {
      if (key.startsWith(`${division}:`)) {
        _cache.delete(key)
      }
    }
  }
}

// ============================================================
// Adapter
// ============================================================

export class ExactAdapter implements AccountingAdapter {
  /**
   * @param token    - OAuth access token (stored as `accessToken` on AccountingConnection)
   * @param division - Division (administratie) ID (stored as `externalAdminId`)
   */
  constructor(
    private readonly token: string,
    private readonly division: string,
  ) {}

  // -------------------------------------------------------
  // OAuth
  // -------------------------------------------------------

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id:     getClientId(),
      redirect_uri:  redirectUri,
      response_type: 'code',
      state,
    })
    return `${EXACT_AUTH_URL}?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
    return this.exchangeOAuthTokens(
      new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     getClientId(),
        client_secret: getClientSecret(),
      }),
    )
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return this.exchangeOAuthTokens(
      new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     getClientId(),
        client_secret: getClientSecret(),
      }),
    )
  }

  // -------------------------------------------------------
  // Connection / Administrations
  // -------------------------------------------------------

  async getAdministrations(): Promise<Administration[]> {
    // Step 1: discover the current division from the /Me endpoint
    const meData = await this.makeRequest<ODataCollection<ExactMe>>('GET', '/current/Me')
    const currentDivision = meData.d.results[0]?.CurrentDivision
    if (!currentDivision) return []

    // Step 2: list all divisions available to this token
    const divData = await this.makeRequest<ODataCollection<ExactDivision>>(
      'GET',
      `/${currentDivision}/hrm/Divisions`,
    )
    return divData.d.results.map((div) => ({
      id:       String(div.Code),
      name:     div.Description,
      currency: div.Currency,
      country:  div.Country,
    }))
  }

  async validateConnection(): Promise<boolean> {
    try {
      const data = await this.makeRequest<ODataCollection<ExactMe>>('GET', '/current/Me')
      return Array.isArray(data.d?.results) && data.d.results.length > 0
    } catch {
      return false
    }
  }

  // -------------------------------------------------------
  // Customer methods
  // -------------------------------------------------------

  async createCustomer(customer: CustomerPayload): Promise<ExternalCustomer> {
    const payload = this.buildAccountPayload(customer)
    const response = await this.makeRequest<ODataSingle<ExactAccount>>(
      'POST',
      `/${this.division}/crm/Accounts`,
      payload,
    )
    return this.transformAccount(response.d)
  }

  async updateCustomer(externalId: string, customer: CustomerPayload): Promise<ExternalCustomer> {
    const payload = this.buildAccountPayload(customer)
    // PUT returns 204 No Content — reconstruct from what we sent
    await this.makeRequest<void>(
      'PUT',
      `/${this.division}/crm/Accounts(guid'${externalId}')`,
      payload,
    )
    const name =
      customer.companyName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
      externalId
    return {
      id:    externalId,
      name,
      email: customer.email,
      externalUrl: this.accountUrl(externalId),
    }
  }

  async findCustomerByEmail(email: string): Promise<ExternalCustomer | null> {
    // Escape single quotes in the email for OData filter safety
    const safeEmail = email.replace(/'/g, "''")
    const filter    = `Email eq '${safeEmail}'`
    const data = await this.makeRequest<ODataCollection<ExactAccount>>(
      'GET',
      `/${this.division}/crm/Accounts?$filter=${encodeURIComponent(filter)}&$select=ID,Name,Email`,
    )
    const results = data.d?.results ?? []
    const match = results.find((a) => a.Email?.toLowerCase() === email.toLowerCase())
    return match ? this.transformAccount(match) : null
  }

  // -------------------------------------------------------
  // Invoice methods
  // -------------------------------------------------------

  async createInvoice(invoice: InvoicePayload): Promise<ExternalInvoice> {
    const payload: ExactSalesInvoicePayload = {
      OrderedBy:   invoice.externalCustomerId,
      YourRef:     invoice.invoiceNumber,
      InvoiceDate: format(invoice.date, 'yyyy-MM-dd'),
      DueDate:     format(invoice.dueDate, 'yyyy-MM-dd'),
      SalesInvoiceLines: {
        results: invoice.items.map((item) =>
          this.buildSalesInvoiceLine(item, invoice.vatMappings, invoice.ledgerMappings),
        ),
      },
    }
    const response = await this.makeRequest<ODataSingle<ExactSalesInvoiceResponse>>(
      'POST',
      `/${this.division}/salesinvoice/SalesInvoices`,
      payload,
    )
    const res = response.d
    return {
      id:            res.InvoiceID,
      invoiceNumber: String(res.InvoiceNumber),
      externalUrl:   this.invoiceUrl(res.InvoiceID),
    }
  }

  async updateInvoiceStatus(_externalId: string, _status: string): Promise<void> {
    // Exact Online does not expose a direct status-change endpoint.
    // Payment matching is handled natively within Exact (bank reconciliation,
    // BankEntries, etc.). This is intentionally a no-op.
  }

  async createCreditNote(creditNote: CreditNotePayload): Promise<ExternalCreditNote> {
    const payload: ExactSalesInvoicePayload = {
      OrderedBy:   creditNote.externalCustomerId,
      YourRef:     creditNote.creditNoteNumber,
      InvoiceDate: format(creditNote.date, 'yyyy-MM-dd'),
      DueDate:     format(creditNote.date, 'yyyy-MM-dd'),
      Type:        21, // Exact Online type 21 = credit note
      ...(creditNote.originalInvoiceExternalId
        ? { Description: `Credit nota voor factuur ${creditNote.originalInvoiceExternalId}` }
        : {}),
      SalesInvoiceLines: {
        results: creditNote.items.map((item) =>
          this.buildSalesInvoiceLine(item, creditNote.vatMappings, creditNote.ledgerMappings),
        ),
      },
    }
    const response = await this.makeRequest<ODataSingle<ExactSalesInvoiceResponse>>(
      'POST',
      `/${this.division}/salesinvoice/SalesInvoices`,
      payload,
    )
    return {
      id:          response.d.InvoiceID,
      externalUrl: this.invoiceUrl(response.d.InvoiceID),
    }
  }

  // -------------------------------------------------------
  // Metadata methods
  // -------------------------------------------------------

  async getLedgerAccounts(): Promise<LedgerAccount[]> {
    const key = `${this.division}:ledgers`
    const cached = this.getCached<LedgerAccount[]>(key)
    if (cached) return cached

    // Type 12 = P&L (revenue/expense) accounts in Exact Online NL chart of accounts
    const data = await this.makeRequest<ODataCollection<ExactGLAccount>>(
      'GET',
      `/${this.division}/financial/GLAccounts?$filter=Type eq 12&$select=ID,Code,Description,Type&$top=1000`,
    )
    const result = (data.d?.results ?? []).map((a) => ({
      id:          a.ID,
      code:        a.Code,
      name:        a.Description,
      accountType: a.Type !== undefined ? String(a.Type) : undefined,
    }))
    this.setCache(key, result)
    return result
  }

  async getVatCodes(): Promise<VatCode[]> {
    const key = `${this.division}:vatcodes`
    const cached = this.getCached<VatCode[]>(key)
    if (cached) return cached

    const data = await this.makeRequest<ODataCollection<ExactVATCode>>(
      'GET',
      `/${this.division}/vat/VATCodes?$select=ID,Code,Description,VATPercentage&$top=100`,
    )
    const result = (data.d?.results ?? []).map((v) => ({
      id:         v.ID,
      name:       v.Description,
      percentage: v.VATPercentage ?? 0,
      taxRateType: v.Type,
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

  private buildAccountPayload(customer: CustomerPayload): Partial<ExactAccount> {
    const name =
      customer.companyName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
      undefined
    return {
      Name:             name,
      Email:            customer.email,
      Phone:            customer.phone,
      AddressLine1:     customer.address,
      Postcode:         customer.zipcode,
      City:             customer.city,
      Country:          customer.country,
      ChamberOfCommerce: customer.chamberOfCommerce,
      VATNumber:        customer.taxNumber,
    }
  }

  private buildSalesInvoiceLine(
    item: InvoiceLinePayload,
    vatMappings: VatMapping[],
    ledgerMappings: LedgerMapping[],
  ): ExactSalesInvoiceLine {
    const vatMapping    = this.getVatMapping(item.vatRate, vatMappings)
    const ledgerMapping = this.getLedgerMapping(item, ledgerMappings)
    return {
      Description: item.description,
      Quantity:    item.quantity,
      UnitPrice:   item.unitPrice,
      VATCode:     vatMapping?.externalVatId    ?? null,
      GLAccount:   ledgerMapping?.externalLedgerId ?? null,
    }
  }

  private transformAccount(account: ExactAccount): ExternalCustomer {
    return {
      id:          account.ID,
      name:        account.Name ?? account.ID,
      email:       account.Email,
      externalUrl: this.accountUrl(account.ID),
    }
  }

  private accountUrl(id: string): string {
    return `${EXACT_NL_BASE}/nl/crm/account.aspx?division=${this.division}&entry=${id}`
  }

  private invoiceUrl(id: string): string {
    return `${EXACT_NL_BASE}/nl/finance/invoice.aspx?division=${this.division}&entry=${id}`
  }

  /**
   * Shared handler for both authorization_code and refresh_token grant types.
   * Note: Exact Online access tokens expire after 10 minutes.
   */
  private async exchangeOAuthTokens(params: URLSearchParams): Promise<TokenResponse> {
    let response: Response
    try {
      response = await fetch(EXACT_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
    } catch (error) {
      throw new AccountingSyncError(
        'Network request to Exact Online OAuth endpoint failed',
        SyncErrorType.NETWORK_ERROR,
        { cause: error },
      )
    }

    const payload = await response.json() as ExactTokenPayload

    if (!response.ok) {
      throw new AccountingSyncError(
        `Exact Online token exchange failed: ${payload.error_description ?? payload.error ?? response.statusText}`,
        SyncErrorType.AUTHENTICATION_FAILED,
        { statusCode: response.status },
      )
    }

    // Exact always returns 600 seconds; use that as the fallback
    const expiresIn = payload.expires_in ?? TOKEN_LIFETIME_SECONDS
    return {
      accessToken:  payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    }
  }

  /**
   * Sends an authenticated request to the Exact Online REST API.
   * Handles all documented error status codes and parses X-RateLimit headers
   * on 429 responses (60 req/min limit per OAuth client).
   */
  private async makeRequest<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${EXACT_API_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept:         'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (error) {
      throw new AccountingSyncError(
        'Network request to Exact Online API failed',
        SyncErrorType.NETWORK_ERROR,
        { cause: error },
      )
    }

    if (response.status === 401) {
      throw new AccountingSyncError(
        'Exact Online authentication failed: invalid or expired access token',
        SyncErrorType.AUTHENTICATION_FAILED,
        { statusCode: 401 },
      )
    }

    if (response.status === 404) {
      throw new AccountingSyncError(
        'Exact Online resource not found',
        SyncErrorType.NOT_FOUND,
        { statusCode: 404 },
      )
    }

    if (response.status === 429) {
      // Parse X-RateLimit-Reset (Unix timestamp) or Retry-After (seconds)
      let retryAfterSecs: number | undefined
      const retryAfterHeader = response.headers.get('Retry-After')
      const resetHeader      = response.headers.get('X-RateLimit-Reset')

      if (retryAfterHeader !== null) {
        const parsed = parseInt(retryAfterHeader, 10)
        if (!Number.isNaN(parsed)) retryAfterSecs = parsed
      } else if (resetHeader !== null) {
        const resetAt = parseInt(resetHeader, 10)
        if (!Number.isNaN(resetAt)) {
          retryAfterSecs = Math.max(0, Math.ceil((resetAt * 1000 - Date.now()) / 1000))
        }
      }

      throw new AccountingSyncError(
        'Exact Online rate limit exceeded (60 req/min)',
        SyncErrorType.RATE_LIMITED,
        { statusCode: 429, retryAfter: retryAfterSecs },
      )
    }

    if (response.status === 400 || response.status === 422) {
      const providerResponse = await response.json().catch(() => undefined)
      throw new AccountingSyncError(
        'Exact Online rejected the request due to a validation error',
        SyncErrorType.VALIDATION_ERROR,
        { statusCode: response.status, providerResponse },
      )
    }

    if (response.status >= 500) {
      throw new AccountingSyncError(
        `Exact Online server error (HTTP ${response.status})`,
        SyncErrorType.PROVIDER_ERROR,
        { statusCode: response.status },
      )
    }

    // 204 No Content (e.g. PUT)
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }
}
