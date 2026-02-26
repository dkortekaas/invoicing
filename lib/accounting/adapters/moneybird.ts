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
  type InvoicePayload,
  type LedgerAccount,
  type TokenResponse,
  type VatCode,
} from '../types'

// ============================================================
// Constants
// ============================================================

const MONEYBIRD_AUTH_URL = 'https://moneybird.com/oauth/authorize'
const MONEYBIRD_TOKEN_URL = 'https://moneybird.com/oauth/token'
const MONEYBIRD_API_URL = 'https://moneybird.com/api/v2'
const SCOPES = ['sales_invoices', 'documents', 'contacts', 'settings']

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

// ============================================================
// Adapter
// ============================================================

export class MoneybirdAdapter implements AccountingAdapter {
  constructor(private readonly token: string) {}

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
    throw new Error('Not implemented')
  }

  // -------------------------------------------------------
  // Customer methods (implemented in a later task)
  // -------------------------------------------------------

  createCustomer(_customer: CustomerPayload): Promise<ExternalCustomer> {
    throw new Error('Not implemented')
  }

  updateCustomer(_externalId: string, _customer: CustomerPayload): Promise<ExternalCustomer> {
    throw new Error('Not implemented')
  }

  findCustomerByEmail(_email: string): Promise<ExternalCustomer | null> {
    throw new Error('Not implemented')
  }

  // -------------------------------------------------------
  // Invoice methods (implemented in a later task)
  // -------------------------------------------------------

  createInvoice(_invoice: InvoicePayload): Promise<ExternalInvoice> {
    throw new Error('Not implemented')
  }

  updateInvoiceStatus(_externalId: string, _status: string): Promise<void> {
    throw new Error('Not implemented')
  }

  createCreditNote(_creditNote: CreditNotePayload): Promise<ExternalCreditNote> {
    throw new Error('Not implemented')
  }

  // -------------------------------------------------------
  // Metadata methods (implemented in a later task)
  // -------------------------------------------------------

  getLedgerAccounts(): Promise<LedgerAccount[]> {
    throw new Error('Not implemented')
  }

  getVatCodes(): Promise<VatCode[]> {
    throw new Error('Not implemented')
  }

  // -------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------

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
