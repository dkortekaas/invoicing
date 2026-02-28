/**
 * YukiAdapter — Yuki accounting integration
 *
 * Yuki uses a SOAP-based API, NOT REST/OAuth2.
 * Authentication is API-key based (Web Service Access Code → sessionID).
 *
 * Credentials stored on AccountingConnection:
 *   accessToken     → Web Service Access Key (API key / "WebserviceAccessCode")
 *   externalAdminId → Administration/Domain ID (GUID)
 *
 * The OAuth lifecycle methods (getAuthUrl, exchangeCodeForTokens,
 * refreshAccessToken) throw immediately because Yuki does not use OAuth.
 *
 * ─── Accountant note ────────────────────────────────────────────────────────
 * Yuki is accountant-oriented software. Every administration connected via
 * this adapter is also accessible to the accountant linked to that domain.
 * Callers should surface YukiAdapter.ACCOUNTANT_NOTE to end-users at setup
 * time and persist it in AccountingSyncLog.errorDetails (as metadata, not an
 * error) for every create / update operation.
 * ────────────────────────────────────────────────────────────────────────────
 */

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

const YUKI_API_BASE   = 'https://api.yukiworks.nl/ws'
const YUKI_NS         = 'http://www.theyukicompany.com/'
const SESSION_TTL_MS  = 20 * 60 * 1000  // conservative; actual idle timeout is ~30 min
const CACHE_TTL_MS    = 15 * 60 * 1000

// ============================================================
// Minimal XML utilities  (no external library required)
// ============================================================

/** Escape text for safe embedding inside an XML element value */
function escXml(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;')
}

/**
 * Return the trimmed text content of the first occurrence of `tag` in `xml`.
 * Only handles non-nested same-name tags; use xmlTagBlocks for repeated elements.
 */
function xmlTag(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`).exec(xml)
  return m ? (m[1] ?? '').trim() : ''
}

/** Return the full outer XML of every occurrence of `tag` (for repeated elements) */
function xmlTagBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'g')
  const out: string[] = []
  let m
  while ((m = re.exec(xml)) !== null) out.push(m[0])
  return out
}

/** Build a SOAP 1.1 envelope around the given method call */
function buildEnvelope(method: string, innerBody: string): string {
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap:Envelope' +
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
    ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
    ' xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<soap:Body>' +
    `<${method} xmlns="${YUKI_NS}">` +
    innerBody +
    `</${method}>` +
    '</soap:Body>' +
    '</soap:Envelope>'
  )
}

// ============================================================
// Session cache  (API key → { sessionId, expiresAt })
// ============================================================

interface SessionEntry { sessionId: string; expiresAt: number }
const _sessions = new Map<string, SessionEntry>()

// ============================================================
// Metadata cache  (ledger / VAT lookups)
// ============================================================

const _cache = new Map<string, { data: unknown; expiresAt: number }>()

export function clearCache(apiKey?: string): void {
  if (apiKey === undefined) {
    _sessions.clear()
    _cache.clear()
  } else {
    _sessions.delete(apiKey)
    for (const k of _cache.keys()) {
      if (k.startsWith(`${apiKey}:`)) _cache.delete(k)
    }
  }
}

// ============================================================
// Adapter
// ============================================================

export class YukiAdapter implements AccountingAdapter {
  /**
   * Human-readable note about Yuki's accountant-oriented model.
   * Include in AccountingSyncLog.errorDetails (as metadata, not error) for
   * every create / update operation to inform the end-user.
   */
  static readonly ACCOUNTANT_NOTE =
    'Let op: Yuki is accountant-gericht. Je accountant heeft mogelijk ook toegang tot deze gegevens.'

  /**
   * @param apiKey  - Web Service Access Key (stored as `accessToken`)
   * @param adminId - Administration / Domain GUID (stored as `externalAdminId`)
   */
  constructor(
    private readonly apiKey: string,
    private readonly adminId: string,
  ) {}

  // -------------------------------------------------------
  // OAuth (not supported — always throws)
  // -------------------------------------------------------

  getAuthUrl(_redirectUri: string, _state: string): string {
    throw new Error('Yuki uses API key auth, not OAuth')
  }

  async exchangeCodeForTokens(_code: string, _redirectUri: string): Promise<TokenResponse> {
    throw new Error('Yuki uses API key auth, not OAuth')
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    throw new Error('Yuki uses API key auth, not OAuth')
  }

  // -------------------------------------------------------
  // Connection / Administrations
  // -------------------------------------------------------

  async getAdministrations(): Promise<Administration[]> {
    // Yuki connections are 1:1 with a domain; there is no public endpoint to
    // enumerate all domains for a key. Return the configured administration as
    // the single entry — the calling code can let users select it during setup.
    const sessionId = await this.getSession()
    // Confirm the administration is reachable by calling GetGLAccountScheme
    const xml = await this.soapCall(
      'AccountingInfo',
      'GetGLAccountScheme',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<administrationID>${escXml(this.adminId)}</administrationID>`,
    )
    // If we get a SOAP fault here an error is thrown by soapCall; otherwise
    // the administration is valid
    const firstCode = xmlTag(xml, 'Code')
    void firstCode  // used only to verify the response parsed
    return [{ id: this.adminId, name: `Yuki administratie ${this.adminId}` }]
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.getSession()
      return true
    } catch {
      return false
    }
  }

  // -------------------------------------------------------
  // Customer methods
  // -------------------------------------------------------

  async createCustomer(customer: CustomerPayload): Promise<ExternalCustomer> {
    const sessionId = await this.getSession()
    const contactXml = this.buildContactXml(customer)
    const xml = await this.soapCall(
      'Contact',
      'SaveRelation',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<domainId>${escXml(this.adminId)}</domainId>` +
      `<xmlDoc><![CDATA[${contactXml}]]></xmlDoc>`,
    )
    return this.extractContact(xml, customer)
  }

  async updateCustomer(externalId: string, customer: CustomerPayload): Promise<ExternalCustomer> {
    const sessionId = await this.getSession()
    const contactXml = this.buildContactXml(customer, externalId)
    await this.soapCall(
      'Contact',
      'SaveRelation',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<domainId>${escXml(this.adminId)}</domainId>` +
      `<xmlDoc><![CDATA[${contactXml}]]></xmlDoc>`,
    )
    const name =
      customer.companyName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
      externalId
    return { id: externalId, name, email: customer.email }
  }

  async findCustomerByEmail(email: string): Promise<ExternalCustomer | null> {
    const sessionId = await this.getSession()
    const xml = await this.soapCall(
      'Contact',
      'SearchContacts',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<domainId>${escXml(this.adminId)}</domainId>` +
      `<searchOption>Email</searchOption>` +
      `<searchValue>${escXml(email)}</searchValue>` +
      `<sortOrder>0</sortOrder>` +
      `<modifiedAfter>0001-01-01</modifiedAfter>` +
      `<active>true</active>` +
      `<pageNumber>0</pageNumber>`,
    )
    const contacts = xmlTagBlocks(xml, 'Contact')
    if (contacts.length === 0) return null
    const match = contacts.find(
      (c) => xmlTag(c, 'EMail').toLowerCase() === email.toLowerCase(),
    )
    if (!match) return null
    const code = xmlTag(match, 'Code') || xmlTag(match, 'ContactCode')
    const name = xmlTag(match, 'FullName') || email
    return { id: code, name, email }
  }

  // -------------------------------------------------------
  // Invoice methods
  // -------------------------------------------------------

  async createInvoice(invoice: InvoicePayload): Promise<ExternalInvoice> {
    const sessionId  = await this.getSession()
    const invoiceXml = this.buildSalesInvoiceXml(invoice)
    const xml = await this.soapCall(
      'Sales',
      'ProcessSalesInvoices',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<administrationId>${escXml(this.adminId)}</administrationId>` +
      `<xmlDoc><![CDATA[${invoiceXml}]]></xmlDoc>`,
    )
    // Extract invoice ID from response; fall back to the reference we sent
    const invoiceId =
      xmlTag(xml, 'InvoiceID') ||
      xmlTag(xml, 'ExternalRef') ||
      invoice.invoiceNumber
    const invoiceNumber =
      xmlTag(xml, 'InvoiceNumber') ||
      xmlTag(xml, 'Reference') ||
      invoice.invoiceNumber
    return { id: invoiceId, invoiceNumber }
  }

  async updateInvoiceStatus(_externalId: string, _status: string): Promise<void> {
    // Yuki does not expose a direct invoice status-change endpoint via SOAP.
    // Payment matching is managed inside Yuki by the accountant.
    // Intentionally a no-op.
  }

  async createCreditNote(creditNote: CreditNotePayload): Promise<ExternalCreditNote> {
    const sessionId     = await this.getSession()
    const creditNoteXml = this.buildCreditNoteXml(creditNote)
    const xml = await this.soapCall(
      'Sales',
      'ProcessSalesInvoices',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<administrationId>${escXml(this.adminId)}</administrationId>` +
      `<xmlDoc><![CDATA[${creditNoteXml}]]></xmlDoc>`,
    )
    const id =
      xmlTag(xml, 'InvoiceID') ||
      xmlTag(xml, 'ExternalRef') ||
      creditNote.creditNoteNumber
    return { id }
  }

  // -------------------------------------------------------
  // Metadata methods
  // -------------------------------------------------------

  async getLedgerAccounts(): Promise<LedgerAccount[]> {
    const key = `${this.apiKey}:ledgers`
    const cached = this.getCached<LedgerAccount[]>(key)
    if (cached) return cached

    const sessionId = await this.getSession()
    const xml = await this.soapCall(
      'AccountingInfo',
      'GetGLAccountScheme',
      `<sessionID>${escXml(sessionId)}</sessionID>` +
      `<administrationID>${escXml(this.adminId)}</administrationID>`,
    )
    const blocks = xmlTagBlocks(xml, 'GLAccount')
    // Filter to revenue accounts: Dutch standard GL codes 8000-8999
    const result = blocks
      .map((b): LedgerAccount => ({
        id:          xmlTag(b, 'Code'),
        code:        xmlTag(b, 'Code'),
        name:        xmlTag(b, 'Description') || xmlTag(b, 'Name'),
        accountType: xmlTag(b, 'Category') || xmlTag(b, 'Type'),
      }))
      .filter((a) => {
        const code = parseInt(a.code ?? '', 10)
        return !Number.isNaN(code) && code >= 8000 && code <= 8999
      })
    this.setCache(key, result)
    return result
  }

  async getVatCodes(): Promise<VatCode[]> {
    // Yuki does not expose a dedicated VAT-codes endpoint via SOAP.
    // Dutch companies use three statutory VAT rates; return them as-is.
    return [
      { id: 'BTW_HOOG',    name: 'BTW hoog (21%)',    percentage: 21 },
      { id: 'BTW_LAAG',    name: 'BTW laag (9%)',      percentage: 9  },
      { id: 'BTW_VRIJST',  name: 'BTW vrijgesteld (0%)', percentage: 0 },
    ]
  }

  // -------------------------------------------------------
  // Private — session management
  // -------------------------------------------------------

  /**
   * Returns a valid sessionID, authenticating if the cached entry has expired.
   * Retry is handled once by the caller (makeSoapCall) if the session turns out
   * to be invalid mid-flight.
   */
  private async getSession(): Promise<string> {
    const cached = _sessions.get(this.apiKey)
    if (cached && Date.now() < cached.expiresAt) return cached.sessionId

    const sessionId = await this.authenticate()
    _sessions.set(this.apiKey, { sessionId, expiresAt: Date.now() + SESSION_TTL_MS })
    return sessionId
  }

  /** Calls Authenticate on the Sales service and returns the raw sessionID GUID */
  private async authenticate(): Promise<string> {
    const envelope = buildEnvelope(
      'Authenticate',
      `<accessKey>${escXml(this.apiKey)}</accessKey>`,
    )
    const text = await this.rawSoapPost('Sales', 'Authenticate', envelope)
    this.checkSoapFault(text, 'authenticate')
    const sessionId = xmlTag(text, 'AuthenticateResult')
    if (!sessionId) {
      throw new AccountingSyncError(
        'Yuki Authenticate returned an empty session ID',
        SyncErrorType.AUTHENTICATION_FAILED,
      )
    }
    return sessionId
  }

  // -------------------------------------------------------
  // Private — SOAP transport
  // -------------------------------------------------------

  /**
   * Makes a SOAP call.
   * On "Invalid session" fault, clears the cached session and retries once.
   */
  private async soapCall(
    service: string,
    method: string,
    innerBody: string,
  ): Promise<string> {
    const envelope = buildEnvelope(method, innerBody)
    const text     = await this.rawSoapPost(service, method, envelope)

    if (this.isInvalidSessionFault(text)) {
      // Session expired mid-flight — refresh and retry once
      _sessions.delete(this.apiKey)
      const newSessionId  = await this.authenticate()
      _sessions.set(this.apiKey, { sessionId: newSessionId, expiresAt: Date.now() + SESSION_TTL_MS })
      // Re-build the body with the new sessionID (replace first occurrence)
      const refreshedBody = innerBody.replace(
        /<sessionID>[^<]*<\/sessionID>/,
        `<sessionID>${escXml(newSessionId)}</sessionID>`,
      )
      const retryEnvelope = buildEnvelope(method, refreshedBody)
      const retryText = await this.rawSoapPost(service, method, retryEnvelope)
      this.checkSoapFault(retryText, method)
      return retryText
    }

    this.checkSoapFault(text, method)
    return text
  }

  /** Raw HTTP POST to a Yuki SOAP endpoint, returns response body as text */
  private async rawSoapPost(
    service: string,
    method: string,
    envelope: string,
  ): Promise<string> {
    let response: Response
    try {
      response = await fetch(`${YUKI_API_BASE}/${service}.asmx`, {
        method:  'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction:     `"${YUKI_NS}${method}"`,
        },
        body: envelope,
      })
    } catch (error) {
      throw new AccountingSyncError(
        'Network request to Yuki SOAP API failed',
        SyncErrorType.NETWORK_ERROR,
        { cause: error },
      )
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After')
      const retryAfter       = retryAfterHeader !== null ? parseInt(retryAfterHeader, 10) : undefined
      throw new AccountingSyncError(
        'Yuki API rate limit exceeded',
        SyncErrorType.RATE_LIMITED,
        {
          statusCode: 429,
          retryAfter: retryAfter !== undefined && !Number.isNaN(retryAfter) ? retryAfter : undefined,
        },
      )
    }

    if (response.status >= 500) {
      throw new AccountingSyncError(
        `Yuki SOAP endpoint returned HTTP ${response.status}`,
        SyncErrorType.PROVIDER_ERROR,
        { statusCode: response.status },
      )
    }

    return response.text()
  }

  /** True when the SOAP response contains an "invalid session" fault */
  private isInvalidSessionFault(xml: string): boolean {
    const fault = xmlTag(xml, 'faultstring') || xmlTag(xml, 'soap:Fault')
    return fault.toLowerCase().includes('session') || fault.toLowerCase().includes('sessie')
  }

  /** Throws AccountingSyncError if the response is a SOAP fault */
  private checkSoapFault(xml: string, method: string): void {
    if (!xml.includes('<faultcode') && !xml.includes('<soap:Fault')) return
    const fault = xmlTag(xml, 'faultstring')
    if (!fault) return

    const lower = fault.toLowerCase()
    if (lower.includes('access') || lower.includes('auth') || lower.includes('session') || lower.includes('invalid key')) {
      throw new AccountingSyncError(
        `Yuki authentication failed: ${fault}`,
        SyncErrorType.AUTHENTICATION_FAILED,
        { providerResponse: xml },
      )
    }
    if (lower.includes('validation') || lower.includes('invalid') || lower.includes('required')) {
      throw new AccountingSyncError(
        `Yuki validation error in ${method}: ${fault}`,
        SyncErrorType.VALIDATION_ERROR,
        { providerResponse: xml },
      )
    }
    throw new AccountingSyncError(
      `Yuki SOAP fault in ${method}: ${fault}`,
      SyncErrorType.PROVIDER_ERROR,
      { providerResponse: xml },
    )
  }

  // -------------------------------------------------------
  // Private — cache helpers
  // -------------------------------------------------------

  private getCached<T>(key: string): T | null {
    const entry = _cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) return null
    return entry.data as T
  }

  private setCache(key: string, data: unknown): void {
    _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  }

  // -------------------------------------------------------
  // Private — mapping helpers
  // -------------------------------------------------------

  private getLedgerMapping(item: InvoiceLinePayload, mappings: LedgerMapping[]): LedgerMapping | undefined {
    if (item.productId) {
      const m = mappings.find(
        (m) => m.sourceType === LedgerSourceType.PRODUCT && m.sourceId === item.productId,
      )
      if (m) return m
    }
    if (item.categoryId) {
      const m = mappings.find(
        (m) => m.sourceType === LedgerSourceType.PRODUCT_CATEGORY && m.sourceId === item.categoryId,
      )
      if (m) return m
    }
    return mappings.find((m) => m.sourceType === LedgerSourceType.DEFAULT)
  }

  // -------------------------------------------------------
  // Private — XML builders
  // -------------------------------------------------------

  /**
   * Build the Contact XML document for SaveRelation.
   * Field names follow the Yuki Contact web service schema:
   * https://api.yukiworks.nl/ws/Contact.asmx?WSDL
   *
   * @param code - existing contact code for updates; omit for creates
   */
  private buildContactXml(customer: CustomerPayload, code?: string): string {
    const name =
      customer.companyName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim()
    return (
      '<Relations xmlns="urn:xmlns:http://www.theyukicompany.com:relations"' +
      ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<Relation>' +
      (code ? `<Code>${escXml(code)}</Code>` : '') +
      `<ContactType>${customer.companyName ? '2' : '1'}</ContactType>` +
      `<FullName>${escXml(name)}</FullName>` +
      `<EMail>${escXml(customer.email)}</EMail>` +
      (customer.phone     ? `<Phone>${escXml(customer.phone)}</Phone>` : '') +
      (customer.address   ? `<AddressLine>${escXml(customer.address)}</AddressLine>` : '') +
      (customer.zipcode   ? `<ZipCode>${escXml(customer.zipcode)}</ZipCode>` : '') +
      (customer.city      ? `<City>${escXml(customer.city)}</City>` : '') +
      (customer.country   ? `<Country>${escXml(customer.country)}</Country>` : '') +
      (customer.taxNumber         ? `<VATNumber>${escXml(customer.taxNumber)}</VATNumber>` : '') +
      (customer.chamberOfCommerce ? `<CoC>${escXml(customer.chamberOfCommerce)}</CoC>` : '') +
      '</Relation>' +
      '</Relations>'
    )
  }

  /** Build the SalesInvoices XML document for ProcessSalesInvoices */
  private buildSalesInvoiceXml(invoice: InvoicePayload): string {
    const linesXml = invoice.items
      .map((item) => this.buildInvoiceLineXml(item, invoice.vatMappings, invoice.ledgerMappings))
      .join('')
    return (
      '<SalesInvoices xmlns="urn:xmlns:http://www.theyukicompany.com:salesinvoices"' +
      ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<SalesInvoice>' +
      `<Reference>${escXml(invoice.invoiceNumber)}</Reference>` +
      `<Date>${format(invoice.date, "yyyy-MM-dd'T'HH:mm:ss")}</Date>` +
      `<DueDate>${format(invoice.dueDate, "yyyy-MM-dd'T'HH:mm:ss")}</DueDate>` +
      `<ContactCode>${escXml(invoice.externalCustomerId)}</ContactCode>` +
      '<PaymentMethod>1</PaymentMethod>' +
      '<PriceIncludesVAT>false</PriceIncludesVAT>' +
      '<InvoiceLines>' +
      linesXml +
      '</InvoiceLines>' +
      '</SalesInvoice>' +
      '</SalesInvoices>'
    )
  }

  /** Build a credit note document — sent via ProcessSalesInvoices with IsCreditNote flag */
  private buildCreditNoteXml(creditNote: CreditNotePayload): string {
    const linesXml = creditNote.items
      .map((item) => this.buildInvoiceLineXml(item, creditNote.vatMappings, creditNote.ledgerMappings))
      .join('')
    return (
      '<SalesInvoices xmlns="urn:xmlns:http://www.theyukicompany.com:salesinvoices"' +
      ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<SalesInvoice>' +
      `<Reference>${escXml(creditNote.creditNoteNumber)}</Reference>` +
      `<Date>${format(creditNote.date, "yyyy-MM-dd'T'HH:mm:ss")}</Date>` +
      `<DueDate>${format(creditNote.date, "yyyy-MM-dd'T'HH:mm:ss")}</DueDate>` +
      `<ContactCode>${escXml(creditNote.externalCustomerId)}</ContactCode>` +
      '<PaymentMethod>1</PaymentMethod>' +
      '<PriceIncludesVAT>false</PriceIncludesVAT>' +
      '<IsCreditNote>true</IsCreditNote>' +
      (creditNote.originalInvoiceExternalId
        ? `<OriginalInvoiceRef>${escXml(creditNote.originalInvoiceExternalId)}</OriginalInvoiceRef>`
        : '') +
      '<InvoiceLines>' +
      linesXml +
      '</InvoiceLines>' +
      '</SalesInvoice>' +
      '</SalesInvoices>'
    )
  }

  private buildInvoiceLineXml(
    item: InvoiceLinePayload,
    _vatMappings: VatMapping[],
    ledgerMappings: LedgerMapping[],
  ): string {
    // Yuki uses the raw VAT percentage on each line — no VAT code ID mapping needed.
    const ledgerMapping = this.getLedgerMapping(item, ledgerMappings)
    return (
      '<InvoiceLine>' +
      `<Description>${escXml(item.description)}</Description>` +
      `<Quantity>${item.quantity}</Quantity>` +
      `<UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>` +
      `<VATPercentage>${item.vatRate.toFixed(2)}</VATPercentage>` +
      (ledgerMapping
        ? `<GLAccountCode>${escXml(ledgerMapping.externalLedgerId)}</GLAccountCode>`
        : '') +
      '</InvoiceLine>'
    )
  }

  /** Extract a contact from a SaveRelation or SearchContacts response */
  private extractContact(xml: string, customer: CustomerPayload): ExternalCustomer {
    const block = xmlTagBlocks(xml, 'Contact')[0] ?? xml
    const code  = xmlTag(block, 'Code') || xmlTag(block, 'ContactCode')
    const name  =
      xmlTag(block, 'FullName') ||
      customer.companyName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
      code
    return { id: code, name, email: customer.email }
  }
}
