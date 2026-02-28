/**
 * Unit tests for lib/accounting/sync-service.ts
 *
 * Mocked modules:
 *   @/lib/db               – Prisma client (all DB calls are fakes)
 *   @/lib/crypto           – encrypt / decrypt
 *   @/lib/accounting/adapter-factory – getAdapter (returns a spy adapter)
 *
 * Prisma enum values are used as plain strings to avoid needing the
 * generated Prisma client in the test environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'
import { AccountingSyncError, SyncErrorType } from './types'

// ─── Hoisted mock instances ─────────────────────────────────────────────────
// vi.hoisted runs before vi.mock factories, so these objects are available
// inside the factory callbacks below.
const { mockDb, mockAdapter, mockGetAdapter, mockDecrypt, mockEncrypt } = vi.hoisted(() => {
  const mockAdapter = {
    createCustomer:       vi.fn(),
    updateCustomer:       vi.fn(),
    findCustomerByEmail:  vi.fn(),
    createInvoice:        vi.fn(),
    updateInvoiceStatus:  vi.fn(),
    createCreditNote:     vi.fn(),
    getLedgerAccounts:    vi.fn(),
    getVatCodes:          vi.fn(),
    getAuthUrl:           vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshAccessToken:   vi.fn(),
    getAdministrations:   vi.fn(),
    validateConnection:   vi.fn(),
  }

  const mockGetAdapter = vi.fn()
  const mockDecrypt    = vi.fn()
  const mockEncrypt    = vi.fn()

  const mockDb = {
    accountingConnection: {
      findUniqueOrThrow: vi.fn(),
      update:            vi.fn(),
    },
    customer: {
      findUniqueOrThrow: vi.fn(),
    },
    syncedCustomer: {
      findUnique:        vi.fn(),
      findUniqueOrThrow: vi.fn(),
      upsert:            vi.fn(),
    },
    invoice: {
      findUniqueOrThrow: vi.fn(),
    },
    syncedInvoice: {
      findUnique: vi.fn(),
      upsert:     vi.fn(),
    },
    accountingSyncLog: {
      create: vi.fn(),
    },
  }

  return { mockDb, mockAdapter, mockGetAdapter, mockDecrypt, mockEncrypt }
})

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/db',                        () => ({ db: mockDb }))
vi.mock('@/lib/accounting/adapter-factory', () => ({ getAdapter: mockGetAdapter }))
vi.mock('@/lib/crypto',                    () => ({ decrypt: mockDecrypt, encrypt: mockEncrypt }))

// ─── System under test (imported AFTER mocks are registered) ─────────────────
import { syncCustomer, syncInvoice, classifyError } from './sync-service'

// ─── Test fixtures ───────────────────────────────────────────────────────────

const CONNECTION_ID  = 'conn-1'
const CUSTOMER_ID    = 'cust-1'
const INVOICE_ID     = 'inv-1'
const EXT_CUSTOMER_ID = 'ext-cust-1'
const EXT_INVOICE_ID  = 'ext-inv-1'

const BASE_CUSTOMER = {
  id:          CUSTOMER_ID,
  name:        'Jan Jansen',
  companyName: null,
  email:       'jan@example.nl',
  phone:       null,
  address:     'Teststraat 1',
  city:        'Amsterdam',
  postalCode:  '1234 AB',
  country:     'NL',
  vatNumber:   null,
}

// Hash that matches BASE_CUSTOMER — used to simulate "already synced, unchanged"
const CUSTOMER_HASH = createHash('sha256')
  .update(
    JSON.stringify({
      name:        BASE_CUSTOMER.name,
      companyName: BASE_CUSTOMER.companyName,
      email:       BASE_CUSTOMER.email,
      phone:       BASE_CUSTOMER.phone,
      address:     BASE_CUSTOMER.address,
      city:        BASE_CUSTOMER.city,
      postalCode:  BASE_CUSTOMER.postalCode,
      country:     BASE_CUSTOMER.country,
      vatNumber:   BASE_CUSTOMER.vatNumber,
    }),
  )
  .digest('hex')

const BASE_CONNECTION = {
  id:              CONNECTION_ID,
  isActive:        true,
  accessToken:     'encrypted-access-token',
  refreshToken:    null,
  tokenExpiresAt:  null,   // skip token-refresh path
  provider:        'MONEYBIRD',
  externalAdminId: 'admin-1',
  vatMappings:     [],
  ledgerMappings:  [],
}

const BASE_INVOICE = {
  id:            INVOICE_ID,
  invoiceNumber: 'FAC-2024-001',
  invoiceDate:   new Date('2024-01-15'),
  dueDate:       new Date('2024-02-14'),
  status:        'SENT',
  customerId:    CUSTOMER_ID,
  customer:      BASE_CUSTOMER,
  items: [
    {
      id:          'item-1',
      description: 'Consulting services',
      quantity:    '2',
      unitPrice:   '500.00',
      vatRate:     '21',
    },
  ],
}

// ─── Shared beforeEach — reset to happy-path defaults ────────────────────────
beforeEach(() => {
  vi.clearAllMocks()

  // crypto mocks
  mockDecrypt.mockReturnValue('decrypted-access-token')
  mockEncrypt.mockReturnValue('new-encrypted-token')

  // adapter-factory always resolves to our mock adapter
  mockGetAdapter.mockResolvedValue(mockAdapter)

  // DB defaults
  mockDb.accountingConnection.findUniqueOrThrow.mockResolvedValue(BASE_CONNECTION)
  mockDb.accountingConnection.update.mockResolvedValue({})
  mockDb.customer.findUniqueOrThrow.mockResolvedValue(BASE_CUSTOMER)
  mockDb.syncedCustomer.findUnique.mockResolvedValue(null)                          // not yet synced
  mockDb.syncedCustomer.findUniqueOrThrow.mockResolvedValue({ externalId: EXT_CUSTOMER_ID })
  mockDb.syncedCustomer.upsert.mockResolvedValue({ externalId: EXT_CUSTOMER_ID })
  mockDb.invoice.findUniqueOrThrow.mockResolvedValue(BASE_INVOICE)
  mockDb.syncedInvoice.findUnique.mockResolvedValue(null)
  mockDb.syncedInvoice.upsert.mockResolvedValue({})
  mockDb.accountingSyncLog.create.mockResolvedValue({})

  // Adapter method defaults
  mockAdapter.createCustomer.mockResolvedValue({ id: EXT_CUSTOMER_ID, name: 'Jan Jansen' })
  mockAdapter.updateCustomer.mockResolvedValue({ id: EXT_CUSTOMER_ID, name: 'Jan Jansen' })
  mockAdapter.createInvoice.mockResolvedValue({ id: EXT_INVOICE_ID, invoiceNumber: 'FAC-2024-001' })
  mockAdapter.updateInvoiceStatus.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────────────────────────────────────
// syncCustomer()
// ─────────────────────────────────────────────────────────────────────────────

describe('syncCustomer()', () => {
  // ── Happy path: first-time create ─────────────────────────────────────────
  describe('happy path — first sync (CREATE)', () => {
    it('returns { success: true, externalId }', async () => {
      const result = await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(result.success).toBe(true)
      expect(result.externalId).toBe(EXT_CUSTOMER_ID)
      expect(result.skipped).toBeUndefined()
    })

    it('calls adapter.createCustomer (not updateCustomer)', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockAdapter.createCustomer).toHaveBeenCalledOnce()
      expect(mockAdapter.updateCustomer).not.toHaveBeenCalled()
    })

    it('upserts a SyncedCustomer record with the external ID', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.syncedCustomer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where:  { connectionId_customerId: { connectionId: CONNECTION_ID, customerId: CUSTOMER_ID } },
          create: expect.objectContaining({ externalId: EXT_CUSTOMER_ID }),
          update: expect.objectContaining({ externalId: EXT_CUSTOMER_ID }),
        }),
      )
    })

    it('writes a SUCCESS sync log with action CREATE', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.accountingSyncLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            connectionId: CONNECTION_ID,
            entityId:     CUSTOMER_ID,
            status:       'SUCCESS',
            action:       'CREATE',
            externalId:   EXT_CUSTOMER_ID,
          }),
        }),
      )
    })

    it('decrypts the stored access token before calling getAdapter', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDecrypt).toHaveBeenCalledWith('encrypted-access-token')
      expect(mockGetAdapter).toHaveBeenCalledWith(
        'MONEYBIRD',
        'decrypted-access-token',
        'admin-1',
      )
    })
  })

  // ── Already synced, hash unchanged → SKIP ─────────────────────────────────
  describe('already synced — data unchanged (SKIPPED)', () => {
    beforeEach(() => {
      mockDb.syncedCustomer.findUnique.mockResolvedValue({
        externalId:   EXT_CUSTOMER_ID,
        lastSyncHash: CUSTOMER_HASH,  // exact match → skip
      })
    })

    it('returns { success: true, skipped: true, externalId }', async () => {
      const result = await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.externalId).toBe(EXT_CUSTOMER_ID)
    })

    it('does not call the adapter at all', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockAdapter.createCustomer).not.toHaveBeenCalled()
      expect(mockAdapter.updateCustomer).not.toHaveBeenCalled()
    })

    it('does not upsert SyncedCustomer', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.syncedCustomer.upsert).not.toHaveBeenCalled()
    })

    it('writes a SKIPPED sync log', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.accountingSyncLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SKIPPED',
            action: 'UPDATE',
          }),
        }),
      )
    })
  })

  // ── Already synced, hash changed → UPDATE ─────────────────────────────────
  describe('already synced — data changed (UPDATE)', () => {
    beforeEach(() => {
      mockDb.syncedCustomer.findUnique.mockResolvedValue({
        externalId:   EXT_CUSTOMER_ID,
        lastSyncHash: 'old-stale-hash',  // different → trigger update
      })
    })

    it('calls adapter.updateCustomer with the existing external ID', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockAdapter.updateCustomer).toHaveBeenCalledWith(
        EXT_CUSTOMER_ID,
        expect.objectContaining({ email: BASE_CUSTOMER.email }),
      )
      expect(mockAdapter.createCustomer).not.toHaveBeenCalled()
    })

    it('returns { success: true } with the external ID', async () => {
      const result = await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(result.success).toBe(true)
      expect(result.externalId).toBe(EXT_CUSTOMER_ID)
    })

    it('writes a SUCCESS sync log with action UPDATE', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.accountingSyncLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SUCCESS',
            action: 'UPDATE',
          }),
        }),
      )
    })
  })

  // ── Adapter throws AUTHENTICATION_FAILED ───────────────────────────────────
  describe('adapter throws AUTHENTICATION_FAILED', () => {
    beforeEach(() => {
      mockAdapter.createCustomer.mockRejectedValue(
        new AccountingSyncError('Token expired', SyncErrorType.AUTHENTICATION_FAILED),
      )
    })

    it('returns { success: false, errorType: AUTHENTICATION_FAILED }', async () => {
      const result = await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe(SyncErrorType.AUTHENTICATION_FAILED)
      expect(result.error).toBeTruthy()
    })

    it('writes a FAILED sync log with the correct errorCode', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.accountingSyncLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status:    'FAILED',
            errorCode: SyncErrorType.AUTHENTICATION_FAILED,
          }),
        }),
      )
    })

    it('records the error message on the connection', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.accountingConnection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CONNECTION_ID },
          data:  expect.objectContaining({ lastError: expect.any(String) }),
        }),
      )
    })
  })

  // ── Adapter throws RATE_LIMITED ────────────────────────────────────────────
  describe('adapter throws RATE_LIMITED', () => {
    beforeEach(() => {
      mockAdapter.createCustomer.mockRejectedValue(
        new AccountingSyncError('Too many requests', SyncErrorType.RATE_LIMITED, { retryAfter: 60 }),
      )
    })

    it('returns { success: false, errorType: RATE_LIMITED }', async () => {
      const result = await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(result.success).toBe(false)
      expect(result.errorType).toBe(SyncErrorType.RATE_LIMITED)
    })

    it('writes a FAILED log with errorCode RATE_LIMITED', async () => {
      await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

      expect(mockDb.accountingSyncLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status:    'FAILED',
            errorCode: SyncErrorType.RATE_LIMITED,
          }),
        }),
      )
    })
  })

  // ── Sync log is always written ─────────────────────────────────────────────
  it('always writes a sync log even when db.accountingConnection.update itself fails', async () => {
    mockAdapter.createCustomer.mockRejectedValue(new Error('provider down'))
    // Simulate the connection update also failing
    mockDb.accountingConnection.update.mockRejectedValue(new Error('db unavailable'))

    const result = await syncCustomer(CONNECTION_ID, CUSTOMER_ID)

    // Function still returns a structured result (doesn't re-throw)
    expect(result.success).toBe(false)
    // The sync log create was still called (even though connection update failed)
    expect(mockDb.accountingSyncLog.create).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// syncInvoice()
// ─────────────────────────────────────────────────────────────────────────────

describe('syncInvoice()', () => {
  // ── Happy path — customer already synced (SKIPPED internally) ─────────────
  describe('happy path — customer already synced, invoice is new', () => {
    beforeEach(() => {
      // Customer was synced previously with a matching hash → syncCustomer will SKIP it
      mockDb.syncedCustomer.findUnique.mockResolvedValue({
        externalId:   EXT_CUSTOMER_ID,
        lastSyncHash: CUSTOMER_HASH,
      })
    })

    it('returns { success: true, externalId }', async () => {
      const result = await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(result.success).toBe(true)
      expect(result.externalId).toBe(EXT_INVOICE_ID)
    })

    it('calls adapter.createInvoice with the externalCustomerId', async () => {
      await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(mockAdapter.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ externalCustomerId: EXT_CUSTOMER_ID }),
      )
    })

    it('upserts SyncedInvoice with the returned external ID', async () => {
      await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(mockDb.syncedInvoice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ externalId: EXT_INVOICE_ID }),
          update: expect.objectContaining({ externalId: EXT_INVOICE_ID }),
        }),
      )
    })

    it('writes a SUCCESS sync log for the invoice', async () => {
      await syncInvoice(CONNECTION_ID, INVOICE_ID)

      // accountingSyncLog.create is called twice: once for customer (SKIPPED),
      // once for invoice (SUCCESS). Find the invoice-specific call.
      const calls = mockDb.accountingSyncLog.create.mock.calls as Array<[{ data: Record<string, unknown> }]>
      const invoiceLog = calls.find((c) => c[0].data['entityType'] === 'INVOICE')
      expect(invoiceLog).toBeDefined()
      expect(invoiceLog![0].data).toMatchObject({ status: 'SUCCESS', action: 'CREATE' })
    })
  })

  // ── Customer not yet synced → syncCustomer runs first ────────────────────
  describe('customer not yet synced', () => {
    it('calls createCustomer before createInvoice', async () => {
      // syncedCustomer.findUnique returns null → customer hasn't been synced yet
      mockDb.syncedCustomer.findUnique.mockResolvedValue(null)

      const result = await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(mockAdapter.createCustomer).toHaveBeenCalledOnce()
      expect(mockAdapter.createInvoice).toHaveBeenCalledOnce()
      expect(result.success).toBe(true)
    })
  })

  // ── Customer sync fails → invoice sync aborted ─────────────────────────────
  describe('customer sync fails', () => {
    beforeEach(() => {
      // Make createCustomer throw so syncCustomer returns { success: false }
      mockAdapter.createCustomer.mockRejectedValue(new Error('provider unavailable'))
    })

    it('does not call createInvoice', async () => {
      await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(mockAdapter.createInvoice).not.toHaveBeenCalled()
    })

    it('returns { success: false }', async () => {
      const result = await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(result.success).toBe(false)
    })

    it('includes a reason mentioning the customer failure', async () => {
      const result = await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(result.error).toMatch(/Customer sync failed/)
    })

    it('writes a FAILED sync log for the invoice', async () => {
      await syncInvoice(CONNECTION_ID, INVOICE_ID)

      const calls = mockDb.accountingSyncLog.create.mock.calls as Array<[{ data: Record<string, unknown> }]>
      const invoiceLog = calls.find((c) => c[0].data['entityType'] === 'INVOICE')
      expect(invoiceLog).toBeDefined()
      expect(invoiceLog![0].data).toMatchObject({ status: 'FAILED' })
    })
  })

  // ── externalUrl persisted on SyncedInvoice ────────────────────────────────
  describe('adapter returns externalUrl', () => {
    const EXTERNAL_URL = 'https://provider.example/invoices/ext-inv-1'

    beforeEach(() => {
      // Customer already synced to skip that path
      mockDb.syncedCustomer.findUnique.mockResolvedValue({
        externalId:   EXT_CUSTOMER_ID,
        lastSyncHash: CUSTOMER_HASH,
      })
      mockAdapter.createInvoice.mockResolvedValue({
        id:            EXT_INVOICE_ID,
        invoiceNumber: 'FAC-2024-001',
        externalUrl:   EXTERNAL_URL,
      })
    })

    it('saves externalUrl to SyncedInvoice on both create and update sides of upsert', async () => {
      await syncInvoice(CONNECTION_ID, INVOICE_ID)

      expect(mockDb.syncedInvoice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ externalUrl: EXTERNAL_URL }),
          update: expect.objectContaining({ externalUrl: EXTERNAL_URL }),
        }),
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// classifyError()
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyError()', () => {
  it('returns the errorType from an AccountingSyncError directly', () => {
    const err = new AccountingSyncError('msg', SyncErrorType.RATE_LIMITED)
    expect(classifyError(err)).toBe(SyncErrorType.RATE_LIMITED)
  })

  it('classifies ECONNREFUSED as NETWORK_ERROR', () => {
    expect(classifyError(new Error('ECONNREFUSED'))).toBe(SyncErrorType.NETWORK_ERROR)
  })

  it('classifies "401" message as AUTHENTICATION_FAILED', () => {
    expect(classifyError(new Error('HTTP 401 unauthorized'))).toBe(SyncErrorType.AUTHENTICATION_FAILED)
  })

  it('classifies "429 too many requests" as RATE_LIMITED', () => {
    expect(classifyError(new Error('429 too many requests'))).toBe(SyncErrorType.RATE_LIMITED)
  })

  it('classifies "not found" as NOT_FOUND', () => {
    expect(classifyError(new Error('resource not found'))).toBe(SyncErrorType.NOT_FOUND)
  })

  it('returns UNKNOWN for unrecognised errors', () => {
    expect(classifyError(new Error('something completely unexpected'))).toBe(SyncErrorType.UNKNOWN)
    expect(classifyError('a string error')).toBe(SyncErrorType.UNKNOWN)
    expect(classifyError(null)).toBe(SyncErrorType.UNKNOWN)
  })
})
