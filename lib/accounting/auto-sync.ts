import { db } from '@/lib/db'
import { syncCustomer, syncInvoice, syncCreditNote } from './sync-service'
import { withRetry } from './retry'
import { AccountingSyncError, SyncErrorType } from './types'
import type { SyncResult } from './sync-service'

// ============================================================
// Internal Helpers
// ============================================================

/**
 * Wraps a sync call so that a failed SyncResult (success: false, not skipped)
 * is surfaced as a thrown AccountingSyncError. This lets withRetry observe
 * the failure and apply its back-off logic.
 *
 * syncInvoice/syncCustomer/syncCreditNote never throw — they catch internally
 * and return { success: false }. We need to turn that into a throw so the
 * retry wrapper can do its job.
 */
async function throwOnFailure(call: () => Promise<SyncResult>): Promise<void> {
  const result = await call()
  if (!result.success && !result.skipped) {
    throw new AccountingSyncError(
      result.error ?? 'Sync failed',
      result.errorType ?? SyncErrorType.UNKNOWN,
    )
  }
}

/**
 * Runs a sync call for one connection with full retry logic.
 * Errors after all retries are silently discarded — the sync-service
 * has already written every attempt to AccountingSyncLog.
 */
function runWithRetry(call: () => Promise<SyncResult>): Promise<void> {
  return withRetry(() => throwOnFailure(call)).catch(() => undefined)
}

// ============================================================
// Fire-and-forget Auto-sync Triggers
// ============================================================

/**
 * Called when an invoice is sent. Fires sync to all active connections
 * with autoSyncInvoices = true. Never throws; never blocks the caller.
 */
export function onInvoiceSent(invoiceId: string, userId: string): void {
  void (async () => {
    const connections = await db.accountingConnection
      .findMany({
        where: { userId, isActive: true, autoSyncInvoices: true },
        select: { id: true },
      })
      .catch(() => [])

    await Promise.allSettled(
      connections.map((c) =>
        runWithRetry(() => syncInvoice(c.id, invoiceId)),
      ),
    )
  })()
}

/**
 * Called when a credit note is created. Fires sync to all active connections
 * with autoSyncCreditNotes = true. Never throws; never blocks the caller.
 */
export function onCreditNoteCreated(creditNoteId: string, userId: string): void {
  void (async () => {
    const connections = await db.accountingConnection
      .findMany({
        where: { userId, isActive: true, autoSyncCreditNotes: true },
        select: { id: true },
      })
      .catch(() => [])

    await Promise.allSettled(
      connections.map((c) =>
        runWithRetry(() => syncCreditNote(c.id, creditNoteId)),
      ),
    )
  })()
}

/**
 * Called when a customer is created or updated. Fires sync to all active
 * connections with autoSyncCustomers = true. Never throws; never blocks the caller.
 */
export function onCustomerChanged(customerId: string, userId: string): void {
  void (async () => {
    const connections = await db.accountingConnection
      .findMany({
        where: { userId, isActive: true, autoSyncCustomers: true },
        select: { id: true },
      })
      .catch(() => [])

    await Promise.allSettled(
      connections.map((c) =>
        runWithRetry(() => syncCustomer(c.id, customerId)),
      ),
    )
  })()
}
