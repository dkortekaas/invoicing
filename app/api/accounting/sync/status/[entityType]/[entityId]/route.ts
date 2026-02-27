import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { SyncStatusEntry, SyncStatusResponse } from '@/types/accounting'

type EntityTypeParam = 'customer' | 'invoice' | 'credit-note'

const VALID_ENTITY_TYPES = new Set<string>(['customer', 'invoice', 'credit-note'])

/** Verified owner of the entity exists; returns false when not found or not owned. */
async function verifyOwnership(
  entityType: EntityTypeParam,
  entityId: string,
  userId: string,
): Promise<boolean> {
  switch (entityType) {
    case 'customer': {
      const r = await db.customer.findUnique({
        where: { id: entityId, userId },
        select: { id: true },
      })
      return r !== null
    }
    case 'invoice': {
      const r = await db.invoice.findUnique({
        where: { id: entityId, userId },
        select: { id: true },
      })
      return r !== null
    }
    case 'credit-note': {
      const r = await db.creditNote.findUnique({
        where: { id: entityId, userId },
        select: { id: true },
      })
      return r !== null
    }
  }
}

interface SyncedRecord {
  externalId: string
  externalNumber: string | null
  externalUrl: string | null
  lastSyncedAt: Date
  syncedStatus: string | null
}

/** Returns a map of connectionId → synced record for the given entity. */
async function getSyncedRecords(
  entityType: EntityTypeParam,
  entityId: string,
): Promise<Map<string, SyncedRecord>> {
  const map = new Map<string, SyncedRecord>()

  switch (entityType) {
    case 'customer': {
      const rows = await db.syncedCustomer.findMany({
        where: { customerId: entityId },
        select: { connectionId: true, externalId: true, lastSyncedAt: true },
      })
      for (const r of rows) {
        map.set(r.connectionId, {
          externalId: r.externalId,
          externalNumber: null,
          externalUrl: null,
          lastSyncedAt: r.lastSyncedAt,
          syncedStatus: null,
        })
      }
      break
    }
    case 'invoice': {
      const rows = await db.syncedInvoice.findMany({
        where: { invoiceId: entityId },
        select: {
          connectionId: true,
          externalId: true,
          externalNumber: true,
          externalUrl: true,
          lastSyncedAt: true,
          syncedStatus: true,
        },
      })
      for (const r of rows) {
        map.set(r.connectionId, {
          externalId: r.externalId,
          externalNumber: r.externalNumber,
          externalUrl: r.externalUrl,
          lastSyncedAt: r.lastSyncedAt,
          syncedStatus: r.syncedStatus,
        })
      }
      break
    }
    case 'credit-note': {
      const rows = await db.syncedCreditNote.findMany({
        where: { creditNoteId: entityId },
        select: {
          connectionId: true,
          externalId: true,
          externalNumber: true,
          externalUrl: true,
          lastSyncedAt: true,
        },
      })
      for (const r of rows) {
        map.set(r.connectionId, {
          externalId: r.externalId,
          externalNumber: r.externalNumber ?? null,
          externalUrl: r.externalUrl ?? null,
          lastSyncedAt: r.lastSyncedAt,
          syncedStatus: null,
        })
      }
      break
    }
  }

  return map
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entityType: entityTypeParam, entityId } = await params

  if (!VALID_ENTITY_TYPES.has(entityTypeParam)) {
    return NextResponse.json(
      { error: `Invalid entity type. Must be one of: ${[...VALID_ENTITY_TYPES].join(', ')}` },
      { status: 400 },
    )
  }

  const entityType = entityTypeParam as EntityTypeParam

  const isOwner = await verifyOwnership(entityType, entityId, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [connections, syncedMap] = await Promise.all([
    db.accountingConnection.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, provider: true, providerName: true },
    }),
    getSyncedRecords(entityType, entityId),
  ])

  const synced: SyncStatusEntry[] = connections.map((connection) => {
    const record = syncedMap.get(connection.id)
    return {
      provider: connection.provider,
      providerName: connection.providerName,
      externalId: record?.externalId ?? null,
      externalNumber: record?.externalNumber ?? null,
      externalUrl: record?.externalUrl ?? null,
      lastSyncedAt: record?.lastSyncedAt ?? null,
      syncedStatus: record?.syncedStatus ?? null,
      isSynced: record !== undefined,
    }
  })

  const response: SyncStatusResponse = { synced }
  return NextResponse.json(response)
}
