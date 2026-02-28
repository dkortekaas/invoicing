import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MoneybirdAdapter, clearCache } from './moneybird'
import { AccountingSyncError, SyncErrorType, type InvoicePayload } from '../types'

// ─── Mock global fetch ────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ─── Helper: build a minimal fake Response ───────────────────────────────────

function fakeResponse(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {},
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    // Header names are case-insensitive in HTTP; normalise to lowercase for lookup
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  } as unknown as Response
}

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const ADMIN_ID = '112233'
const TOKEN    = 'mb-test-token'

// Use plain objects cast to `any` so tests run without a generated Prisma client
const VAT_21 = { vatRate: 21, externalVatId: 'vat-tax-21' } as any
const VAT_09 = { vatRate: 9,  externalVatId: 'vat-tax-09' } as any

const LEDGER_PRODUCT: any  = { sourceType: 'PRODUCT',          sourceId: 'product-1', externalLedgerId: 'ledger-product-1' }
const LEDGER_CATEGORY: any = { sourceType: 'PRODUCT_CATEGORY', sourceId: 'cat-1',     externalLedgerId: 'ledger-cat-1' }
const LEDGER_DEFAULT: any  = { sourceType: 'DEFAULT',          sourceId: null,        externalLedgerId: 'ledger-default' }

function makeInvoice(overrides: Partial<InvoicePayload> = {}): InvoicePayload {
  return {
    invoiceNumber:      'FAC-2024-001',
    date:               new Date('2024-01-15'),
    dueDate:            new Date('2024-02-14'),
    externalCustomerId: 'ext-cust-99',
    customer:           { companyName: 'Acme BV' },
    items: [
      { description: 'Consulting', quantity: 2, unitPrice: 500, vatRate: 21, productId: 'product-1' },
    ],
    vatMappings:    [VAT_21, VAT_09],
    ledgerMappings: [LEDGER_PRODUCT, LEDGER_CATEGORY, LEDGER_DEFAULT],
    ...overrides,
  }
}

// ─── Per-test reset ───────────────────────────────────────────────────────────

beforeEach(() => {
  // resetAllMocks clears call history AND return-value stubs so every test is clean
  vi.resetAllMocks()
  clearCache()
  process.env.MONEYBIRD_CLIENT_ID     = 'client-id-abc'
  process.env.MONEYBIRD_CLIENT_SECRET = 'client-secret-xyz'
})

afterEach(() => {
  delete process.env.MONEYBIRD_CLIENT_ID
  delete process.env.MONEYBIRD_CLIENT_SECRET
  vi.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. getAuthUrl()
// ─────────────────────────────────────────────────────────────────────────────

describe('getAuthUrl()', () => {
  const REDIRECT = 'https://app.example/callback'
  const STATE    = 'csrf-state-token'

  function parsedUrl() {
    return new URL(new MoneybirdAdapter(TOKEN, ADMIN_ID).getAuthUrl(REDIRECT, STATE))
  }

  it('base URL is https://moneybird.com/oauth/authorize', () => {
    const url = new MoneybirdAdapter(TOKEN, ADMIN_ID).getAuthUrl(REDIRECT, STATE)
    expect(url).toContain('moneybird.com/oauth/authorize')
  })

  it('includes client_id from MONEYBIRD_CLIENT_ID env var', () => {
    expect(parsedUrl().searchParams.get('client_id')).toBe('client-id-abc')
  })

  it('includes the redirect_uri', () => {
    expect(parsedUrl().searchParams.get('redirect_uri')).toBe(REDIRECT)
  })

  it('sets response_type=code', () => {
    expect(parsedUrl().searchParams.get('response_type')).toBe('code')
  })

  it('includes the state param', () => {
    expect(parsedUrl().searchParams.get('state')).toBe(STATE)
  })

  it.each(['sales_invoices', 'documents', 'contacts', 'settings'])(
    'scope includes "%s"',
    (scope) => {
      const scopes = (parsedUrl().searchParams.get('scope') ?? '').split(' ')
      expect(scopes).toContain(scope)
    },
  )

  it('throws when MONEYBIRD_CLIENT_ID env var is missing', () => {
    delete process.env.MONEYBIRD_CLIENT_ID
    expect(() =>
      new MoneybirdAdapter(TOKEN, ADMIN_ID).getAuthUrl(REDIRECT, STATE),
    ).toThrow(/MONEYBIRD_CLIENT_ID/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. createInvoice() — payload mapping (tests the private transform logic)
// ─────────────────────────────────────────────────────────────────────────────

describe('createInvoice() — invoice-to-Moneybird payload mapping', () => {
  /** Parse the JSON body sent to the mocked fetch on the first call */
  function sentBody() {
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    return JSON.parse(init.body as string) as {
      sales_invoice: {
        contact_id: string
        invoice_date: string
        due_date: string
        prices_are_incl_tax: boolean
        details_attributes: Array<{
          description: string
          price: string
          amount: string
          tax_rate_id: string | null
          ledger_account_id: string | null
        }>
      }
    }
  }

  beforeEach(() => {
    mockFetch.mockResolvedValue(
      fakeResponse(201, { sales_invoice: { id: '9001', invoice_id: 'MB-001' } }),
    )
  })

  it('contact_id equals invoice.externalCustomerId', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(makeInvoice({ externalCustomerId: 'cust-42' }))
    expect(sentBody().sales_invoice.contact_id).toBe('cust-42')
  })

  it('invoice_date is formatted as yyyy-MM-dd', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(makeInvoice({ date: new Date('2024-03-07') }))
    expect(sentBody().sales_invoice.invoice_date).toBe('2024-03-07')
  })

  it('details_attributes length matches invoice.items length', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(
      makeInvoice({
        items: [
          { description: 'A', quantity: 1, unitPrice: 100, vatRate: 21, productId: 'p1' },
          { description: 'B', quantity: 2, unitPrice:  50, vatRate:  9, productId: 'p2' },
          { description: 'C', quantity: 3, unitPrice:  25, vatRate:  0 },
        ],
      }),
    )
    expect(sentBody().sales_invoice.details_attributes).toHaveLength(3)
  })

  it('tax_rate_id is resolved from vatMappings by vatRate', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(
      makeInvoice({
        items:       [{ description: 'X', quantity: 1, unitPrice: 200, vatRate: 21 }],
        vatMappings: [{ vatRate: 21, externalVatId: 'vat-id-21' } as any],
      }),
    )
    expect(sentBody().sales_invoice.details_attributes[0].tax_rate_id).toBe('vat-id-21')
  })

  it('ledger_account_id is resolved from ledgerMappings by product', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(
      makeInvoice({
        items:          [{ description: 'Y', quantity: 1, unitPrice: 300, vatRate: 21, productId: 'p-abc' }],
        ledgerMappings: [{ sourceType: 'PRODUCT', sourceId: 'p-abc', externalLedgerId: 'ledger-77' } as any],
      }),
    )
    expect(sentBody().sales_invoice.details_attributes[0].ledger_account_id).toBe('ledger-77')
  })

  it('falls back to DEFAULT ledger mapping when no product match exists', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(
      makeInvoice({
        items: [{ description: 'Z', quantity: 1, unitPrice: 100, vatRate: 21, productId: 'no-match' }],
        ledgerMappings: [
          { sourceType: 'PRODUCT', sourceId: 'other-product', externalLedgerId: 'ledger-wrong' } as any,
          { sourceType: 'DEFAULT', sourceId: null,            externalLedgerId: 'ledger-fallback' } as any,
        ],
      }),
    )
    expect(sentBody().sales_invoice.details_attributes[0].ledger_account_id).toBe('ledger-fallback')
  })

  it('prices_are_incl_tax is false', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(makeInvoice())
    expect(sentBody().sales_invoice.prices_are_incl_tax).toBe(false)
  })

  it('tax_rate_id is null when VAT mapping is missing (no crash)', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(
      makeInvoice({
        items:       [{ description: 'X', quantity: 1, unitPrice: 100, vatRate: 21 }],
        vatMappings: [],
      }),
    )
    expect(sentBody().sales_invoice.details_attributes[0].tax_rate_id).toBeNull()
  })

  it('ledger_account_id is null when no ledger mapping exists at all', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    await adapter.createInvoice(
      makeInvoice({
        items:          [{ description: 'X', quantity: 1, unitPrice: 100, vatRate: 21 }],
        ledgerMappings: [],
      }),
    )
    expect(sentBody().sales_invoice.details_attributes[0].ledger_account_id).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. makeRequest() error handling  (exercised through getAdministrations())
// ─────────────────────────────────────────────────────────────────────────────

describe('makeRequest() error handling', () => {
  let adapter: MoneybirdAdapter

  beforeEach(() => {
    adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
  })

  /** Invoke getAdministrations() and capture the thrown error */
  async function getError(): Promise<AccountingSyncError> {
    const err = await adapter.getAdministrations().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(AccountingSyncError)
    return err as AccountingSyncError
  }

  it('429 with Retry-After: 30 → RATE_LIMITED with retryAfter = 30', async () => {
    mockFetch.mockResolvedValue(fakeResponse(429, {}, { 'retry-after': '30' }))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.RATE_LIMITED)
    expect(err.retryAfter).toBe(30)
  })

  it('429 without Retry-After header → RATE_LIMITED with retryAfter undefined', async () => {
    mockFetch.mockResolvedValue(fakeResponse(429, {}))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.RATE_LIMITED)
    expect(err.retryAfter).toBeUndefined()
  })

  it('401 → AUTHENTICATION_FAILED', async () => {
    mockFetch.mockResolvedValue(fakeResponse(401, {}))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.AUTHENTICATION_FAILED)
    expect(err.statusCode).toBe(401)
  })

  it('422 → VALIDATION_ERROR with response body in providerResponse', async () => {
    const errorBody = { errors: { contact: ['is required'] } }
    mockFetch.mockResolvedValue(fakeResponse(422, errorBody))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.VALIDATION_ERROR)
    expect(err.statusCode).toBe(422)
    expect(err.providerResponse).toBeDefined()
    expect(err.providerResponse).toEqual(errorBody)
  })

  it('500 → PROVIDER_ERROR', async () => {
    mockFetch.mockResolvedValue(fakeResponse(500, {}))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.PROVIDER_ERROR)
    expect(err.statusCode).toBe(500)
  })

  it('503 → PROVIDER_ERROR', async () => {
    mockFetch.mockResolvedValue(fakeResponse(503, {}))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.PROVIDER_ERROR)
    expect(err.statusCode).toBe(503)
  })

  it('network error (fetch throws) → NETWORK_ERROR', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const err = await getError()
    expect(err.errorType).toBe(SyncErrorType.NETWORK_ERROR)
  })

  it('sends Authorization: Bearer <token> header', async () => {
    mockFetch.mockResolvedValue(fakeResponse(200, []))

    await adapter.getAdministrations()

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${TOKEN}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. findCustomerByEmail()
// ─────────────────────────────────────────────────────────────────────────────

describe('findCustomerByEmail()', () => {
  let adapter: MoneybirdAdapter

  beforeEach(() => {
    adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
  })

  function contact(id: string, email: string, companyName = 'Test BV') {
    return { id, company_name: companyName, firstname: '', lastname: '', email, phone: '' }
  }

  it('returns the matching contact when the API returns multiple results', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse(200, [
        contact('1', 'other@example.com', 'Other BV'),
        contact('2', 'match@example.com', 'Match BV'),
        contact('3', 'yet-another@example.com'),
      ]),
    )

    const result = await adapter.findCustomerByEmail('match@example.com')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('2')
    expect(result!.email).toBe('match@example.com')
    expect(result!.name).toBe('Match BV')
  })

  it('returns null when the API returns an empty array', async () => {
    mockFetch.mockResolvedValue(fakeResponse(200, []))

    expect(await adapter.findCustomerByEmail('nobody@example.com')).toBeNull()
  })

  it('returns null when no result has an exact email match', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse(200, [
        contact('1', 'similar@example.com'),
        contact('2', 'closebut@example.com'),
      ]),
    )

    expect(await adapter.findCustomerByEmail('exact@example.com')).toBeNull()
  })

  it('email comparison is case-sensitive (Moneybird behaviour)', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse(200, [contact('5', 'User@Example.com')]),
    )

    // lowercase search must NOT match the mixed-case stored email
    expect(await adapter.findCustomerByEmail('user@example.com')).toBeNull()
  })

  it('passes the email as a URL-encoded query param', async () => {
    mockFetch.mockResolvedValue(fakeResponse(200, []))

    const email = 'search+test@example.com'
    await adapter.findCustomerByEmail(email)

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain(`query=${encodeURIComponent(email)}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. getLedgerAccounts() — caching
// ─────────────────────────────────────────────────────────────────────────────

describe('getLedgerAccounts() cache', () => {
  const LEDGER_DATA = [
    { id: '10', account_id: '8000', name: 'Omzet producten', account_type: 'revenue' },
    { id: '11', account_id: '8100', name: 'Omzet diensten',  account_type: 'revenue' },
  ]

  it('second call within TTL does not make a new fetch()', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    mockFetch.mockResolvedValue(fakeResponse(200, LEDGER_DATA))

    await adapter.getLedgerAccounts()
    await adapter.getLedgerAccounts()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('second call returns the same result as the first', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    mockFetch.mockResolvedValue(fakeResponse(200, LEDGER_DATA))

    const first  = await adapter.getLedgerAccounts()
    const second = await adapter.getLedgerAccounts()

    expect(second).toEqual(first)
    expect(second).toHaveLength(2)
  })

  it('call after TTL (15 min) expires makes a new fetch()', async () => {
    vi.useFakeTimers()
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    mockFetch.mockResolvedValue(fakeResponse(200, LEDGER_DATA))

    await adapter.getLedgerAccounts()
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Advance past the 15-minute cache TTL
    vi.advanceTimersByTime(15 * 60 * 1000 + 1)

    await adapter.getLedgerAccounts()
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('clearCache(adminId) forces a fresh fetch on next call', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    mockFetch.mockResolvedValue(fakeResponse(200, LEDGER_DATA))

    await adapter.getLedgerAccounts()
    clearCache(ADMIN_ID)
    await adapter.getLedgerAccounts()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('filters out non-revenue account types', async () => {
    const adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    mockFetch.mockResolvedValue(
      fakeResponse(200, [
        { id: '1', account_id: '8000', name: 'Omzet',     account_type: 'revenue' },
        { id: '2', account_id: '4000', name: 'Huur',       account_type: 'expense' },  // excluded
        { id: '3', account_id: '8200', name: 'Ander ink.', account_type: 'other_income' },
        { id: '4', account_id: '9000', name: 'Inkoop',     account_type: 'purchase' }, // excluded
      ]),
    )

    const result = await adapter.getLedgerAccounts()

    expect(result).toHaveLength(2)
    expect(result.map((a) => a.id)).toEqual(['1', '3'])
  })

  it('two different adapters share the same cache (module-level)', async () => {
    const a1 = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    const a2 = new MoneybirdAdapter(TOKEN, ADMIN_ID)
    mockFetch.mockResolvedValue(fakeResponse(200, LEDGER_DATA))

    await a1.getLedgerAccounts()
    await a2.getLedgerAccounts() // should hit cache, not fetch again

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
