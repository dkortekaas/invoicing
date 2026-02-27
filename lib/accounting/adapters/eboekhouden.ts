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

const EBOEKHOUDEN_API_URL = 'https://rest.e-boekhouden.nl/api'
const CACHE_TTL_MS = 15 * 60 * 1000

// ============================================================
// Internal Response Shapes (e-Boekhouden REST API v1)
// ============================================================

interface EboekhoudenRelatie {
  RelatieId: number
  Bedrijfsnaam?: string
  Voornaam?: string
  Achternaam?: string
  Email?: string
  Telefoon?: string
  Adres?: string
  Postcode?: string
  Plaats?: string
  Land?: string
  KvKNummer?: string
  BTWNummer?: string
}

interface EboekhoudenFactuurRegel {
  Omschrijving: string
  Aantal: number
  PrijsPerEenheid: number
  BTWPercentage: number
  GrootboekId?: number | null
}

interface EboekhoudenFactuurPayload {
  Factuurnummer?: string
  Datum: string
  Vervaldatum: string
  RelatieId: number
  IsCreditnota?: boolean
  OrigineleFactuurId?: number
  Regels: EboekhoudenFactuurRegel[]
}

interface EboekhoudenFactuurResponse {
  FactuurId: number
  Factuurnummer: string
}

interface EboekhoudenFactuurDetail extends EboekhoudenFactuurResponse {
  Bedrag?: number
}

interface EboekhoudenGrootboekrekening {
  GrootboekId: number
  Code: string
  Omschrijving: string
  Categorie?: string
}

interface EboekhoudenBTWTarief {
  BTWTarief: string
  Omschrijving: string
  Percentage: number
}

interface EboekhoudenMutatie {
  SoortMutatie: number
  Datum: string
  Factuurnummer?: string
  Omschrijving: string
  Bedrag: number
  MutatieRegels: EboekhoudenMutatieRegel[]
}

interface EboekhoudenMutatieRegel {
  GrootboekId: number
  Bedrag: number
}

// ============================================================
// In-memory cache (shared across all EboekhoudenAdapter instances)
// ============================================================

const _cache = new Map<string, { data: unknown; expiresAt: number }>()

export function clearCache(username?: string): void {
  if (username === undefined) {
    _cache.clear()
  } else {
    for (const key of _cache.keys()) {
      if (key.startsWith(`${username}:`)) {
        _cache.delete(key)
      }
    }
  }
}

// ============================================================
// Adapter
// ============================================================

export class EboekhoudenAdapter implements AccountingAdapter {
  /**
   * @param username     - Stored as `accessToken` on AccountingConnection
   * @param securityCode1 - Stored as `refreshToken` on AccountingConnection
   * @param securityCode2 - Stored as `externalAdminId` on AccountingConnection
   */
  constructor(
    private readonly username: string,
    private readonly securityCode1: string,
    private readonly securityCode2: string,
  ) {}

  // -------------------------------------------------------
  // OAuth (not supported — always throws)
  // -------------------------------------------------------

  getAuthUrl(_redirectUri: string, _state: string): string {
    throw new Error('e-Boekhouden uses API token auth, not OAuth')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exchangeCodeForTokens(_code: string, _redirectUri: string): Promise<TokenResponse> {
    throw new Error('e-Boekhouden uses API token auth, not OAuth')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    throw new Error('e-Boekhouden uses API token auth, not OAuth')
  }

  // -------------------------------------------------------
  // Connection / Administrations
  // -------------------------------------------------------

  async getAdministrations(): Promise<Administration[]> {
    // e-Boekhouden accounts map 1-to-1 with a connection; no sub-administrations
    return []
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.makeRequest<EboekhoudenGrootboekrekening[]>('GET', '/v1/grootboekrekeningen')
      return true
    } catch {
      return false
    }
  }

  // -------------------------------------------------------
  // Customer methods
  // -------------------------------------------------------

  async createCustomer(customer: CustomerPayload): Promise<ExternalCustomer> {
    const payload: Partial<EboekhoudenRelatie> = this.buildRelatiePayload(customer)
    const response = await this.makeRequest<EboekhoudenRelatie>('POST', '/v1/relaties', payload)
    return this.transformRelatie(response)
  }

  async updateCustomer(externalId: string, customer: CustomerPayload): Promise<ExternalCustomer> {
    const payload: Partial<EboekhoudenRelatie> = this.buildRelatiePayload(customer)
    const response = await this.makeRequest<EboekhoudenRelatie>(
      'PUT',
      `/v1/relaties/${externalId}`,
      payload,
    )
    return this.transformRelatie(response)
  }

  async findCustomerByEmail(email: string): Promise<ExternalCustomer | null> {
    const data = await this.makeRequest<EboekhoudenRelatie[]>(
      'GET',
      `/v1/relaties?emailadres=${encodeURIComponent(email)}`,
    )
    if (!Array.isArray(data) || data.length === 0) return null
    const match = data.find((r) => r.Email?.toLowerCase() === email.toLowerCase())
    return match ? this.transformRelatie(match) : null
  }

  // -------------------------------------------------------
  // Invoice methods
  // -------------------------------------------------------

  async createInvoice(invoice: InvoicePayload): Promise<ExternalInvoice> {
    const payload: EboekhoudenFactuurPayload = {
      Factuurnummer: invoice.invoiceNumber,
      Datum: format(invoice.date, 'yyyy-MM-dd'),
      Vervaldatum: format(invoice.dueDate, 'yyyy-MM-dd'),
      RelatieId: parseInt(invoice.externalCustomerId, 10),
      Regels: invoice.items.map((item) =>
        this.buildFactuurRegel(item, invoice.vatMappings, invoice.ledgerMappings),
      ),
    }
    const response = await this.makeRequest<EboekhoudenFactuurResponse>('POST', '/v1/facturen', payload)
    return {
      id: String(response.FactuurId),
      invoiceNumber: response.Factuurnummer,
    }
  }

  async updateInvoiceStatus(externalId: string, status: string): Promise<void> {
    // e-Boekhouden REST does not expose a direct status-change endpoint.
    // For PAID invoices we best-effort register a payment mutation (SoortMutatie 2).
    if (status !== 'PAID') return

    const invoice = await this.makeRequest<EboekhoudenFactuurDetail>(
      'GET',
      `/v1/facturen/${externalId}`,
    ).catch(() => null)

    if (!invoice) return

    const mutatie: EboekhoudenMutatie = {
      SoortMutatie: 2, // Debiteur betaling
      Datum: format(new Date(), 'yyyy-MM-dd'),
      Factuurnummer: invoice.Factuurnummer,
      Omschrijving: `Betaling factuur ${invoice.Factuurnummer ?? externalId}`,
      Bedrag: invoice.Bedrag ?? 0,
      MutatieRegels: [],
    }

    // Best-effort — a failed payment registration should not fail the invoice sync
    await this.makeRequest('POST', '/v1/mutaties', mutatie).catch(() => undefined)
  }

  async createCreditNote(creditNote: CreditNotePayload): Promise<ExternalCreditNote> {
    const payload: EboekhoudenFactuurPayload = {
      Factuurnummer: creditNote.creditNoteNumber,
      Datum: format(creditNote.date, 'yyyy-MM-dd'),
      Vervaldatum: format(creditNote.date, 'yyyy-MM-dd'),
      RelatieId: parseInt(creditNote.externalCustomerId, 10),
      IsCreditnota: true,
      ...(creditNote.originalInvoiceExternalId
        ? { OrigineleFactuurId: parseInt(creditNote.originalInvoiceExternalId, 10) }
        : {}),
      Regels: creditNote.items.map((item) =>
        this.buildFactuurRegel(item, creditNote.vatMappings, creditNote.ledgerMappings),
      ),
    }
    const response = await this.makeRequest<EboekhoudenFactuurResponse>('POST', '/v1/facturen', payload)
    return { id: String(response.FactuurId) }
  }

  // -------------------------------------------------------
  // Metadata methods
  // -------------------------------------------------------

  async getLedgerAccounts(): Promise<LedgerAccount[]> {
    const key = `${this.username}:ledgers`
    const cached = this.getCached<LedgerAccount[]>(key)
    if (cached) return cached

    const data = await this.makeRequest<EboekhoudenGrootboekrekening[]>('GET', '/v1/grootboekrekeningen')
    const result = data.map((a) => ({
      id: String(a.GrootboekId),
      code: a.Code,
      name: a.Omschrijving,
      accountType: a.Categorie,
    }))
    this.setCache(key, result)
    return result
  }

  async getVatCodes(): Promise<VatCode[]> {
    const key = `${this.username}:vatcodes`
    const cached = this.getCached<VatCode[]>(key)
    if (cached) return cached

    const data = await this.makeRequest<EboekhoudenBTWTarief[]>('GET', '/v1/btwtarieven')
    const result = data.map((v) => ({
      id: v.BTWTarief,
      name: v.Omschrijving,
      percentage: v.Percentage,
    }))
    this.setCache(key, result)
    return result
  }

  // -------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------

  private getCached<T>(key: string): T | null {
    const entry = _cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) return null
    return entry.data as T
  }

  private setCache(key: string, data: unknown): void {
    _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
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

  private buildRelatiePayload(customer: CustomerPayload): Partial<EboekhoudenRelatie> {
    return {
      Bedrijfsnaam: customer.companyName,
      Voornaam: customer.firstName,
      Achternaam: customer.lastName,
      Email: customer.email,
      Telefoon: customer.phone,
      Adres: customer.address,
      Postcode: customer.zipcode,
      Plaats: customer.city,
      Land: customer.country,
      KvKNummer: customer.chamberOfCommerce,
      BTWNummer: customer.taxNumber,
    }
  }

  private buildFactuurRegel(
    item: InvoiceLinePayload,
    _vatMappings: VatMapping[],
    ledgerMappings: LedgerMapping[],
  ): EboekhoudenFactuurRegel {
    // e-Boekhouden uses the raw VAT percentage on each line — no VAT code mapping needed.
    const ledgerMapping = this.getLedgerMapping(item, ledgerMappings)
    const grootboekId = ledgerMapping ? parseInt(ledgerMapping.externalLedgerId, 10) : null
    return {
      Omschrijving: item.description,
      Aantal: item.quantity,
      PrijsPerEenheid: item.unitPrice,
      BTWPercentage: item.vatRate,
      GrootboekId: grootboekId !== null && !Number.isNaN(grootboekId) ? grootboekId : null,
    }
  }

  private transformRelatie(relatie: EboekhoudenRelatie): ExternalCustomer {
    const name =
      relatie.Bedrijfsnaam ||
      [relatie.Voornaam, relatie.Achternaam].filter(Boolean).join(' ').trim() ||
      `Relatie ${relatie.RelatieId}`
    return {
      id: String(relatie.RelatieId),
      name,
      email: relatie.Email,
    }
  }

  /**
   * Sends an authenticated request to the e-Boekhouden REST API.
   * Authentication is header-based: Username / SecurityCode1 / SecurityCode2.
   */
  private async makeRequest<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${EBOEKHOUDEN_API_URL}${path}`, {
        method,
        headers: {
          Username: this.username,
          SecurityCode1: this.securityCode1,
          SecurityCode2: this.securityCode2,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (error) {
      throw new AccountingSyncError(
        'Network request to e-Boekhouden API failed',
        SyncErrorType.NETWORK_ERROR,
        { cause: error },
      )
    }

    if (response.status === 401 || response.status === 403) {
      throw new AccountingSyncError(
        'e-Boekhouden authentication failed: invalid credentials',
        SyncErrorType.AUTHENTICATION_FAILED,
        { statusCode: response.status },
      )
    }

    if (response.status === 404) {
      throw new AccountingSyncError(
        'e-Boekhouden resource not found',
        SyncErrorType.NOT_FOUND,
        { statusCode: 404 },
      )
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After')
      const retryAfterSecs = retryAfterHeader !== null ? parseInt(retryAfterHeader, 10) : undefined
      throw new AccountingSyncError(
        'e-Boekhouden rate limit exceeded',
        SyncErrorType.RATE_LIMITED,
        {
          statusCode: 429,
          retryAfter:
            retryAfterSecs !== undefined && !Number.isNaN(retryAfterSecs)
              ? retryAfterSecs
              : undefined,
        },
      )
    }

    if (response.status === 400 || response.status === 422) {
      const providerResponse = await response.json().catch(() => undefined)
      throw new AccountingSyncError(
        'e-Boekhouden rejected the request due to a validation error',
        SyncErrorType.VALIDATION_ERROR,
        { statusCode: response.status, providerResponse },
      )
    }

    if (response.status >= 500) {
      throw new AccountingSyncError(
        `e-Boekhouden server error (HTTP ${response.status})`,
        SyncErrorType.PROVIDER_ERROR,
        { statusCode: response.status },
      )
    }

    // 204 No Content — successful but no body
    if (response.status === 204) {
      return {} as T
    }

    return response.json() as Promise<T>
  }
}
