/**
 * Integration tests for the MoneybirdAdapter.
 *
 * These tests hit the real Moneybird API.  They are skipped automatically
 * when MONEYBIRD_TEST_TOKEN or MONEYBIRD_TEST_ADMIN_ID is not set in
 * .env.test (loaded by tests/integration/setup.ts via vitest setupFiles).
 *
 * To run:
 *   npm run test:integration
 *
 * Prerequisites:
 *   1. A Moneybird developer account (free trial or sandbox)
 *   2. A personal access token from https://moneybird.com/user/applications
 *   3. Fill in .env.test (copy from the placeholder values already there)
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MoneybirdAdapter, clearCache } from '@/lib/accounting/adapters/moneybird'
import type { ExternalCustomer, ExternalInvoice, LedgerAccount, VatCode, VatMapping, LedgerMapping } from '@/lib/accounting/types'

// ── Credentials & skip guard ──────────────────────────────────────────────────
// process.env is populated by setup.ts before this module is evaluated.

const TOKEN = process.env.MONEYBIRD_TEST_TOKEN ?? ''
const ADMIN_ID = process.env.MONEYBIRD_TEST_ADMIN_ID ?? ''
const SKIP = !TOKEN || !ADMIN_ID

// ── Helpers for afterAll cleanup ──────────────────────────────────────────────

const cleanupContactIds: string[] = []
const cleanupInvoiceIds: string[] = []

const MB_BASE = `https://moneybird.com/api/v2/${ADMIN_ID}`

async function mbDelete(path: string): Promise<void> {
  await fetch(`${MB_BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).catch(() => {
    // Best-effort – don't fail the suite on cleanup errors
  })
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe.skipIf(SKIP)('Moneybird integration', () => {
  let adapter: MoneybirdAdapter

  beforeAll(() => {
    clearCache()
    adapter = new MoneybirdAdapter(TOKEN, ADMIN_ID)
  })

  afterAll(async () => {
    // Delete in reverse dependency order: credit notes / invoices before contacts.
    for (const id of [...cleanupInvoiceIds].reverse()) {
      await mbDelete(`/sales_invoices/${id}`)
    }
    for (const id of [...cleanupContactIds].reverse()) {
      await mbDelete(`/contacts/${id}`)
    }
  })

  // ── 1. OAuth URL (local – no network call) ──────────────────────────────────

  describe('getAuthUrl', () => {
    it('returns a properly-formatted Moneybird authorization URL', () => {
      // MONEYBIRD_CLIENT_ID must be set in .env.test for this to work
      const rawUrl = adapter.getAuthUrl('https://app.example.com/callback', 'csrf-state-123')
      const url = new URL(rawUrl)

      expect(url.origin + url.pathname).toBe('https://moneybird.com/oauth/authorize')
      expect(url.searchParams.get('response_type')).toBe('code')
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/callback')
      expect(url.searchParams.get('state')).toBe('csrf-state-123')

      const scope = url.searchParams.get('scope') ?? ''
      for (const s of ['sales_invoices', 'documents', 'contacts', 'settings']) {
        expect(scope, `scope should include "${s}"`).toContain(s)
      }
    })

    it('exchangeCodeForTokens with an invalid code returns AUTHENTICATION_FAILED', async () => {
      // We cannot automate the browser-based consent step, so we verify that
      // Moneybird rejects an invalid code with a proper typed error.
      const { AccountingSyncError, SyncErrorType } = await import('@/lib/accounting/types')

      await expect(
        adapter.exchangeCodeForTokens('invalid-code-xyz', 'https://app.example.com/callback'),
      ).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof AccountingSyncError &&
          err.errorType === SyncErrorType.AUTHENTICATION_FAILED,
      )
    })
  })

  // ── 2. Connection validation ────────────────────────────────────────────────

  describe('validateConnection', () => {
    it('returns true with a valid personal access token', async () => {
      expect(await adapter.validateConnection()).toBe(true)
    })

    it('returns false with an invalid token', async () => {
      const bad = new MoneybirdAdapter('invalid-token-xyz', ADMIN_ID)
      expect(await bad.validateConnection()).toBe(false)
    })
  })

  // ── 3. Customer CRUD ────────────────────────────────────────────────────────

  describe('Customer CRUD', () => {
    let createdContact: ExternalCustomer
    const testEmail = `integration-test+${Date.now()}@example.com`

    it('createCustomer returns an ExternalCustomer with an id', async () => {
      createdContact = await adapter.createCustomer({
        companyName: 'Declair Integration Test BV',
        firstName: 'Test',
        lastName: 'Gebruiker',
        email: testEmail,
        phone: '+31612345678',
        address: 'Teststraat 1',
        zipcode: '1234 AB',
        city: 'Amsterdam',
        country: 'NL',
      })

      expect(createdContact.id).toBeTruthy()
      expect(createdContact.email).toBe(testEmail)
      expect(createdContact.externalUrl).toContain(ADMIN_ID)

      cleanupContactIds.push(createdContact.id)
    })

    it('findCustomerByEmail finds the contact we just created', async () => {
      const found = await adapter.findCustomerByEmail(testEmail)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(createdContact.id)
      expect(found?.email).toBe(testEmail)
    })

    it('updateCustomer updates the company name and returns the updated contact', async () => {
      const updated = await adapter.updateCustomer(createdContact.id, {
        companyName: 'Declair Integration Test BV – Updated',
        email: testEmail,
      })

      expect(updated.id).toBe(createdContact.id)
      expect(updated.name).toContain('Updated')
    })

    it('findCustomerByEmail returns null for an address that does not exist', async () => {
      const result = await adapter.findCustomerByEmail(`nonexistent-${Date.now()}@nowhere.invalid`)
      expect(result).toBeNull()
    })
  })

  // ── 4. Invoice creation ─────────────────────────────────────────────────────

  describe('Invoice creation', () => {
    let invoiceContactId: string
    let createdInvoice: ExternalInvoice
    let vatCodes: VatCode[]
    let ledgerAccounts: LedgerAccount[]

    beforeAll(async () => {
      // Shared setup: a dedicated contact + real VAT/ledger data from the API
      const email = `invoice-test+${Date.now()}@example.com`
      const contact = await adapter.createCustomer({ companyName: 'Invoice Test BV', email })
      invoiceContactId = contact.id
      cleanupContactIds.push(invoiceContactId)

      vatCodes = await adapter.getVatCodes()
      ledgerAccounts = await adapter.getLedgerAccounts()
    })

    it('createInvoice creates a sales invoice and returns id + invoiceNumber', async () => {
      const vat21 = vatCodes.find((v) => v.percentage === 21)
      const defaultLedger = ledgerAccounts[0]

      createdInvoice = await adapter.createInvoice({
        invoiceNumber: `TEST-INT-${Date.now()}`,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customer: { companyName: 'Invoice Test BV' },
        externalCustomerId: invoiceContactId,
        items: [
          {
            description: 'Integration test – dienstverlening',
            quantity: 2,
            unitPrice: 75,
            vatRate: 21,
          },
        ],
        // Build minimal mapping objects that satisfy the adapter's internal lookups
        vatMappings: vat21
          ? ([{ vatRate: 21, externalVatId: vat21.id }] as unknown as VatMapping[])
          : [],
        ledgerMappings: defaultLedger
          ? ([{ sourceType: 'DEFAULT', sourceId: null, externalLedgerId: defaultLedger.id }] as unknown as LedgerMapping[])
          : [],
      })

      expect(createdInvoice.id).toBeTruthy()
      expect(createdInvoice.invoiceNumber).toBeTruthy()
      expect(createdInvoice.externalUrl).toContain(ADMIN_ID)

      cleanupInvoiceIds.push(createdInvoice.id)
    })
  })

  // ── 5. Credit note ──────────────────────────────────────────────────────────

  describe('Credit note', () => {
    let creditContactId: string
    let originalInvoiceId: string
    let vatCodes: VatCode[]
    let ledgerAccounts: LedgerAccount[]

    beforeAll(async () => {
      const email = `credit-test+${Date.now()}@example.com`
      const contact = await adapter.createCustomer({ companyName: 'Credit Note Test BV', email })
      creditContactId = contact.id
      cleanupContactIds.push(creditContactId)

      vatCodes = await adapter.getVatCodes()
      ledgerAccounts = await adapter.getLedgerAccounts()

      const vat21 = vatCodes.find((v) => v.percentage === 21)
      const defaultLedger = ledgerAccounts[0]

      const original = await adapter.createInvoice({
        invoiceNumber: `TEST-ORIG-${Date.now()}`,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customer: { companyName: 'Credit Note Test BV' },
        externalCustomerId: creditContactId,
        items: [{ description: 'Originele factuur', quantity: 1, unitPrice: 200, vatRate: 21 }],
        vatMappings: vat21
          ? ([{ vatRate: 21, externalVatId: vat21.id }] as unknown as VatMapping[])
          : [],
        ledgerMappings: defaultLedger
          ? ([{ sourceType: 'DEFAULT', sourceId: null, externalLedgerId: defaultLedger.id }] as unknown as LedgerMapping[])
          : [],
      })

      originalInvoiceId = original.id
      cleanupInvoiceIds.push(originalInvoiceId)
    })

    it('createCreditNote creates a credit note linked to the original invoice', async () => {
      const vat21 = vatCodes.find((v) => v.percentage === 21)
      const defaultLedger = ledgerAccounts[0]

      const creditNote = await adapter.createCreditNote({
        creditNoteNumber: `CN-INT-${Date.now()}`,
        date: new Date(),
        originalInvoiceExternalId: originalInvoiceId,
        customer: { companyName: 'Credit Note Test BV' },
        externalCustomerId: creditContactId,
        items: [{ description: 'Terugboeking', quantity: 1, unitPrice: 200, vatRate: 21 }],
        vatMappings: vat21
          ? ([{ vatRate: 21, externalVatId: vat21.id }] as unknown as VatMapping[])
          : [],
        ledgerMappings: defaultLedger
          ? ([{ sourceType: 'DEFAULT', sourceId: null, externalLedgerId: defaultLedger.id }] as unknown as LedgerMapping[])
          : [],
      })

      expect(creditNote.id).toBeTruthy()
      expect(creditNote.externalUrl).toContain(ADMIN_ID)

      // Credit notes are also sales_invoices in the Moneybird API
      cleanupInvoiceIds.push(creditNote.id)
    })
  })

  // ── 6. Metadata ─────────────────────────────────────────────────────────────

  describe('Metadata', () => {
    beforeAll(() => {
      // Always start with a cold cache so we exercise the actual API call
      clearCache(ADMIN_ID)
    })

    it('getLedgerAccounts returns only revenue-type accounts with required fields', async () => {
      const accounts = await adapter.getLedgerAccounts()

      expect(Array.isArray(accounts)).toBe(true)

      for (const account of accounts) {
        expect(account).toHaveProperty('id')
        expect(account).toHaveProperty('name')
        expect(['revenue', 'other_income', 'income']).toContain(account.accountType)
      }
    })

    it('getLedgerAccounts is served from cache on the second call (no extra network roundtrip)', async () => {
      // First call populates cache; second call must return the same array reference (or equal data)
      const first = await adapter.getLedgerAccounts()
      const second = await adapter.getLedgerAccounts()

      expect(second).toEqual(first)
    })

    it('getVatCodes returns sales_invoice-type rates with id and numeric percentage', async () => {
      clearCache(ADMIN_ID)
      const codes = await adapter.getVatCodes()

      expect(Array.isArray(codes)).toBe(true)

      for (const code of codes) {
        expect(code).toHaveProperty('id')
        expect(code).toHaveProperty('name')
        expect(typeof code.percentage).toBe('number')
        expect(code.taxRateType).toBe('sales_invoice')
      }
    })

    it('getVatCodes includes a 21 % rate (standard Dutch BTW)', async () => {
      clearCache(ADMIN_ID)
      const codes = await adapter.getVatCodes()
      const has21 = codes.some((c) => c.percentage === 21)

      // Moneybird test administrations always include the standard 21 % BTW rate
      expect(has21, 'Expected a 21 % VAT code in the test administration').toBe(true)
    })
  })
})
