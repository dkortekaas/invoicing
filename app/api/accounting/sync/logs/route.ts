import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider, SyncEntityType, SyncStatus, type Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { SyncLogListResponse } from '@/types/accounting'

const PROVIDER_VALUES = new Set<string>(Object.values(AccountingProvider))
const ENTITY_TYPE_VALUES = new Set<string>(Object.values(SyncEntityType))
const STATUS_VALUES = new Set<string>(Object.values(SyncStatus))

function parseDate(raw: string | null): Date | undefined {
  if (!raw) return undefined
  const d = new Date(raw)
  return isNaN(d.getTime()) ? undefined : d
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams

  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10) || 20))

  const providerRaw = sp.get('provider')
  const entityTypeRaw = sp.get('entityType')
  const statusRaw = sp.get('status')

  const provider =
    providerRaw !== null && PROVIDER_VALUES.has(providerRaw)
      ? (providerRaw as AccountingProvider)
      : undefined

  const entityType =
    entityTypeRaw !== null && ENTITY_TYPE_VALUES.has(entityTypeRaw)
      ? (entityTypeRaw as SyncEntityType)
      : undefined

  const status =
    statusRaw !== null && STATUS_VALUES.has(statusRaw)
      ? (statusRaw as SyncStatus)
      : undefined

  const dateFrom = parseDate(sp.get('dateFrom'))
  const dateTo = parseDate(sp.get('dateTo'))

  const where: Prisma.AccountingSyncLogWhereInput = {
    connection: {
      userId: session.user.id,
      ...(provider !== undefined ? { provider } : {}),
    },
    ...(entityType !== undefined ? { entityType } : {}),
    ...(status !== undefined ? { status } : {}),
    createdAt:
      dateFrom !== undefined || dateTo !== undefined
        ? { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) }
        : undefined,
  }

  const [logs, total, failed, pending] = await Promise.all([
    db.accountingSyncLog.findMany({
      where,
      include: {
        connection: { select: { provider: true, providerName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.accountingSyncLog.count({ where }),
    db.accountingSyncLog.count({ where: { ...where, status: SyncStatus.FAILED } }),
    db.accountingSyncLog.count({ where: { ...where, status: SyncStatus.PENDING } }),
  ])

  const formattedLogs = logs.map(({ connection, ...log }) => ({
    ...log,
    provider: connection.provider,
    providerName: connection.providerName,
  }))

  const response: SyncLogListResponse = {
    logs: formattedLogs,
    pagination: { page, limit, total },
    summary: { total, failed, pending },
  }

  return NextResponse.json(response)
}
