import { createHash } from 'crypto'
import { Prisma, SyncEntityType, SyncAction, SyncStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/crypto'
import { getAdapter } from './adapter-factory'
import {
  SyncErrorType,
  AccountingSyncError,
  type CustomerPayload,
  type InvoicePayload,
  type InvoiceLinePayload,
  type CreditNotePayload,
} from './types'

// ============================================================
// Public Result Type
// ============================================================

export interface SyncResult {
  success: boolean
  externalId?: string
  /** True when the entity was unchanged and no API call was made */
  skipped?: boolean
  error?: string
  errorType?: SyncErrorType
}

// ============================================================
// Internal Helpers
// ============================================================

function hashCustomerData(customer: {
  name: string
  companyName: string | null
  email: string
  phone: string | null
  address: string
  city: string
  postalCode: string
  country: string
  vatNumber: string | null
}): string {
  const data = JSON.stringify({
    name: customer.name,
    companyName: customer.companyName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
    vatNumber: customer.vatNumber,
  })
  return createHash('sha256').update(data).digest('hex')
}


export function classifyError(error: unknown): SyncErrorType {
  if (error instanceof AccountingSyncError) {
    return error.errorType
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('etimedout') || msg.includes('network')) {
      return SyncErrorType.NETWORK_ERROR
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('unauthenticated')) {
      return SyncErrorType.AUTHENTICATION_FAILED
    }
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) {
      return SyncErrorType.RATE_LIMITED
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return SyncErrorType.NOT_FOUND
    }
    if (msg.includes('409') || msg.includes('conflict') || msg.includes('duplicate') || msg.includes('already exists')) {
      return SyncErrorType.DUPLICATE
    }
    if (msg.includes('422') || msg.includes('validation') || msg.includes('unprocessable')) {
      return SyncErrorType.VALIDATION_ERROR
    }
    if (msg.includes('5')) {
      // Rough check for 5xx status codes in error messages
      return SyncErrorType.PROVIDER_ERROR
    }
  }
  return SyncErrorType.UNKNOWN
}

/**
 * Loads the accounting connection (with mappings), decrypts the access token,
 * refreshes it if expired, and returns a fully configured adapter instance.
 */
async function getActiveAdapter(connectionId: string) {
  const connection = await db.accountingConnection.findUniqueOrThrow({
    where: { id: connectionId },
    include: { vatMappings: true, ledgerMappings: true },
  })

  if (!connection.isActive) {
    throw new AccountingSyncError(
      'Accounting connection is inactive',
      SyncErrorType.AUTHENTICATION_FAILED,
    )
  }

  let accessToken = decrypt(connection.accessToken)

  // Attempt token refresh when the stored token has expired
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date() && connection.refreshToken) {
    const decryptedRefreshToken = decrypt(connection.refreshToken)
    // Bootstrap a short-lived adapter solely to call the OAuth refresh endpoint
    const tempAdapter = await getAdapter(connection.provider, accessToken, connection.externalAdminId)
    const tokenResponse = await tempAdapter.refreshAccessToken(decryptedRefreshToken)

    await db.accountingConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: encrypt(tokenResponse.accessToken),
        refreshToken: tokenResponse.refreshToken
          ? encrypt(tokenResponse.refreshToken)
          : connection.refreshToken,
        tokenExpiresAt: tokenResponse.expiresAt
          ?? (tokenResponse.expiresIn
            ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
            : null),
      },
    })

    accessToken = tokenResponse.accessToken
  }

  const adapter = await getAdapter(connection.provider, accessToken, connection.externalAdminId)
  return { connection, adapter }
}

function buildCustomerPayload(customer: {
  name: string
  companyName: string | null
  email: string
  phone: string | null
  address: string
  postalCode: string
  city: string
  country: string
  vatNumber: string | null
}): CustomerPayload {
  return {
    companyName: customer.companyName ?? undefined,
    lastName: customer.name,
    email: customer.email,
    phone: customer.phone ?? undefined,
    address: customer.address,
    zipcode: customer.postalCode,
    city: customer.city,
    country: customer.country,
    taxNumber: customer.vatNumber ?? undefined,
  }
}

// ============================================================
// Public Sync Functions
// ============================================================

export async function syncCustomer(connectionId: string, customerId: string): Promise<SyncResult> {
  const startedAt = Date.now()
  let action: SyncAction = SyncAction.CREATE
  let requestPayload: CustomerPayload | null = null

  try {
    const { adapter } = await getActiveAdapter(connectionId)

    const customer = await db.customer.findUniqueOrThrow({ where: { id: customerId } })

    const existingSync = await db.syncedCustomer.findUnique({
      where: { connectionId_customerId: { connectionId, customerId } },
    })

    const currentHash = hashCustomerData(customer)

    if (existingSync) {
      action = SyncAction.UPDATE

      if (existingSync.lastSyncHash === currentHash) {
        await db.accountingSyncLog.create({
          data: {
            connectionId,
            entityType: SyncEntityType.CUSTOMER,
            entityId: customerId,
            action: SyncAction.UPDATE,
            status: SyncStatus.SKIPPED,
            externalId: existingSync.externalId,
            durationMs: Date.now() - startedAt,
          },
        })
        return { success: true, externalId: existingSync.externalId, skipped: true }
      }
    }

    const payload = buildCustomerPayload(customer)
    requestPayload = payload

    const externalCustomer = existingSync
      ? await adapter.updateCustomer(existingSync.externalId, payload)
      : await adapter.createCustomer(payload)

    const now = new Date()

    await db.syncedCustomer.upsert({
      where: { connectionId_customerId: { connectionId, customerId } },
      create: {
        connectionId,
        customerId,
        externalId: externalCustomer.id,
        lastSyncedAt: now,
        lastSyncHash: currentHash,
      },
      update: {
        externalId: externalCustomer.id,
        lastSyncedAt: now,
        lastSyncHash: currentHash,
      },
    })

    await db.accountingConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: now, lastError: null },
    })

    await db.accountingSyncLog.create({
      data: {
        connectionId,
        entityType: SyncEntityType.CUSTOMER,
        entityId: customerId,
        action,
        status: SyncStatus.SUCCESS,
        externalId: externalCustomer.id,
        requestPayload: payload as unknown as Prisma.InputJsonValue,
        responsePayload: externalCustomer as unknown as Prisma.InputJsonValue,
        durationMs: Date.now() - startedAt,
      },
    })

    return { success: true, externalId: externalCustomer.id }
  } catch (error) {
    const errorType = classifyError(error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    await db.accountingConnection
      .update({ where: { id: connectionId }, data: { lastError: errorMessage } })
      .catch(() => undefined)

    await db.accountingSyncLog
      .create({
        data: {
          connectionId,
          entityType: SyncEntityType.CUSTOMER,
          entityId: customerId,
          action,
          status: SyncStatus.FAILED,
          errorMessage,
          errorCode: errorType,
          requestPayload: requestPayload !== null ? (requestPayload as unknown as Prisma.InputJsonValue) : undefined,
          durationMs: Date.now() - startedAt,
        },
      })
      .catch(() => undefined)

    return { success: false, error: errorMessage, errorType }
  }
}

export async function syncInvoice(connectionId: string, invoiceId: string): Promise<SyncResult> {
  const startedAt = Date.now()
  let action: SyncAction = SyncAction.CREATE
  let requestPayload: InvoicePayload | { externalId: string; status: string } | null = null

  try {
    const { connection, adapter } = await getActiveAdapter(connectionId)

    const invoice = await db.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { items: true, customer: true },
    })

    // Ensure the customer is synced before creating the invoice
    const customerResult = await syncCustomer(connectionId, invoice.customerId)
    if (!customerResult.success) {
      throw new AccountingSyncError(
        `Customer sync failed before invoice sync: ${customerResult.error}`,
        customerResult.errorType ?? SyncErrorType.UNKNOWN,
      )
    }

    const syncedCustomer = await db.syncedCustomer.findUniqueOrThrow({
      where: { connectionId_customerId: { connectionId, customerId: invoice.customerId } },
    })

    const existingSync = await db.syncedInvoice.findUnique({
      where: { connectionId_invoiceId: { connectionId, invoiceId } },
    })

    const lines: InvoiceLinePayload[] = invoice.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
    }))

    let externalInvoice: { id: string; invoiceNumber?: string; externalUrl?: string }

    if (existingSync) {
      action = SyncAction.UPDATE
      requestPayload = { externalId: existingSync.externalId, status: invoice.status }
      await adapter.updateInvoiceStatus(existingSync.externalId, invoice.status)
      externalInvoice = {
        id: existingSync.externalId,
        invoiceNumber: existingSync.externalNumber ?? undefined,
        externalUrl: existingSync.externalUrl ?? undefined,
      }
    } else {
      const payload: InvoicePayload = {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        customer: buildCustomerPayload(invoice.customer),
        externalCustomerId: syncedCustomer.externalId,
        items: lines,
        vatMappings: connection.vatMappings,
        ledgerMappings: connection.ledgerMappings,
      }
      requestPayload = payload
      externalInvoice = await adapter.createInvoice(payload)
    }

    const now = new Date()

    await db.syncedInvoice.upsert({
      where: { connectionId_invoiceId: { connectionId, invoiceId } },
      create: {
        connectionId,
        invoiceId,
        externalId: externalInvoice.id,
        externalNumber: externalInvoice.invoiceNumber ?? null,
        externalUrl: externalInvoice.externalUrl ?? null,
        lastSyncedAt: now,
        syncedStatus: invoice.status,
      },
      update: {
        externalId: externalInvoice.id,
        externalNumber: externalInvoice.invoiceNumber ?? null,
        externalUrl: externalInvoice.externalUrl ?? null,
        lastSyncedAt: now,
        syncedStatus: invoice.status,
      },
    })

    await db.accountingConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: now, lastError: null },
    })

    await db.accountingSyncLog.create({
      data: {
        connectionId,
        entityType: SyncEntityType.INVOICE,
        entityId: invoiceId,
        action,
        status: SyncStatus.SUCCESS,
        externalId: externalInvoice.id,
        requestPayload: requestPayload as unknown as Prisma.InputJsonValue,
        responsePayload: externalInvoice as unknown as Prisma.InputJsonValue,
        durationMs: Date.now() - startedAt,
      },
    })

    return { success: true, externalId: externalInvoice.id }
  } catch (error) {
    const errorType = classifyError(error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    await db.accountingConnection
      .update({ where: { id: connectionId }, data: { lastError: errorMessage } })
      .catch(() => undefined)

    await db.accountingSyncLog
      .create({
        data: {
          connectionId,
          entityType: SyncEntityType.INVOICE,
          entityId: invoiceId,
          action,
          status: SyncStatus.FAILED,
          errorMessage,
          errorCode: errorType,
          requestPayload: requestPayload !== null ? (requestPayload as unknown as Prisma.InputJsonValue) : undefined,
          durationMs: Date.now() - startedAt,
        },
      })
      .catch(() => undefined)

    return { success: false, error: errorMessage, errorType }
  }
}

export async function syncCreditNote(connectionId: string, creditNoteId: string): Promise<SyncResult> {
  const startedAt = Date.now()
  const action = SyncAction.CREATE
  let requestPayload: CreditNotePayload | null = null

  try {
    const { connection, adapter } = await getActiveAdapter(connectionId)

    const creditNote = await db.creditNote.findUniqueOrThrow({
      where: { id: creditNoteId },
      include: { items: true, customer: true },
    })

    // Credit notes are immutable once synced — skip if already sent
    const existingSync = await db.syncedCreditNote.findUnique({
      where: { connectionId_creditNoteId: { connectionId, creditNoteId } },
    })

    if (existingSync) {
      await db.accountingSyncLog.create({
        data: {
          connectionId,
          entityType: SyncEntityType.CREDIT_NOTE,
          entityId: creditNoteId,
          action,
          status: SyncStatus.SKIPPED,
          externalId: existingSync.externalId,
          durationMs: Date.now() - startedAt,
        },
      })
      return { success: true, externalId: existingSync.externalId, skipped: true }
    }

    // Ensure the customer is synced before creating the credit note
    const customerResult = await syncCustomer(connectionId, creditNote.customerId)
    if (!customerResult.success) {
      throw new AccountingSyncError(
        `Customer sync failed before credit note sync: ${customerResult.error}`,
        customerResult.errorType ?? SyncErrorType.UNKNOWN,
      )
    }

    const syncedCustomer = await db.syncedCustomer.findUniqueOrThrow({
      where: { connectionId_customerId: { connectionId, customerId: creditNote.customerId } },
    })

    // Look up the external ID of the original invoice if one exists
    let originalInvoiceExternalId: string | undefined
    if (creditNote.originalInvoiceId) {
      const syncedInvoice = await db.syncedInvoice.findUnique({
        where: { connectionId_invoiceId: { connectionId, invoiceId: creditNote.originalInvoiceId } },
      })
      originalInvoiceExternalId = syncedInvoice?.externalId
    }

    const lines: InvoiceLinePayload[] = creditNote.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
    }))

    const payload: CreditNotePayload = {
      creditNoteNumber: creditNote.creditNoteNumber,
      date: creditNote.creditNoteDate,
      originalInvoiceExternalId,
      customer: buildCustomerPayload(creditNote.customer),
      externalCustomerId: syncedCustomer.externalId,
      items: lines,
      vatMappings: connection.vatMappings,
      ledgerMappings: connection.ledgerMappings,
    }
    requestPayload = payload

    const externalCreditNote = await adapter.createCreditNote(payload)

    const now = new Date()

    await db.syncedCreditNote.create({
      data: {
        connectionId,
        creditNoteId,
        externalId: externalCreditNote.id,
        externalUrl: externalCreditNote.externalUrl ?? null,
        lastSyncedAt: now,
      },
    })

    await db.accountingConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: now, lastError: null },
    })

    await db.accountingSyncLog.create({
      data: {
        connectionId,
        entityType: SyncEntityType.CREDIT_NOTE,
        entityId: creditNoteId,
        action,
        status: SyncStatus.SUCCESS,
        externalId: externalCreditNote.id,
        requestPayload: payload as unknown as Prisma.InputJsonValue,
        responsePayload: externalCreditNote as unknown as Prisma.InputJsonValue,
        durationMs: Date.now() - startedAt,
      },
    })

    return { success: true, externalId: externalCreditNote.id }
  } catch (error) {
    const errorType = classifyError(error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    await db.accountingConnection
      .update({ where: { id: connectionId }, data: { lastError: errorMessage } })
      .catch(() => undefined)

    await db.accountingSyncLog
      .create({
        data: {
          connectionId,
          entityType: SyncEntityType.CREDIT_NOTE,
          entityId: creditNoteId,
          action,
          status: SyncStatus.FAILED,
          errorMessage,
          errorCode: errorType,
          requestPayload: requestPayload !== null ? (requestPayload as unknown as Prisma.InputJsonValue) : undefined,
          durationMs: Date.now() - startedAt,
        },
      })
      .catch(() => undefined)

    return { success: false, error: errorMessage, errorType }
  }
}
