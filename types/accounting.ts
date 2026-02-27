import type { AccountingProvider, SyncAction, SyncEntityType, SyncStatus } from '@prisma/client'

// ============================================================
// Sync Log Response Types
// ============================================================

/** One row in the paginated log list — payloads excluded for brevity. */
export interface SyncLogItem {
  id: string
  connectionId: string
  provider: AccountingProvider
  providerName: string
  entityType: SyncEntityType
  entityId: string
  action: SyncAction
  status: SyncStatus
  externalId: string | null
  errorMessage: string | null
  errorCode: string | null
  durationMs: number | null
  createdAt: Date
}

/** Full log record including all JSON payload fields. */
export interface SyncLogDetail extends SyncLogItem {
  errorDetails: unknown
  requestPayload: unknown
  responsePayload: unknown
}

export interface SyncLogListResponse {
  logs: SyncLogItem[]
  pagination: {
    page: number
    limit: number
    total: number
  }
  /** Counts scoped to the same filter as the current request. */
  summary: {
    total: number
    failed: number
    pending: number
  }
}

// ============================================================
// Entity Sync Status Response Types
// ============================================================

export interface SyncStatusEntry {
  provider: AccountingProvider
  providerName: string
  /** null when the entity has not been synced to this connection yet. */
  externalId: string | null
  externalNumber: string | null
  externalUrl: string | null
  lastSyncedAt: Date | null
  /** Invoice status at time of last sync; null for customers and credit notes. */
  syncedStatus: string | null
  isSynced: boolean
}

export interface SyncStatusResponse {
  synced: SyncStatusEntry[]
}
