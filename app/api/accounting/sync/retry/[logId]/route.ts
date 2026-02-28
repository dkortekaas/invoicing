import { NextRequest, NextResponse } from 'next/server'
import { SyncEntityType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { syncCustomer, syncInvoice, syncCreditNote } from '@/lib/accounting/sync-service'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ logId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { logId } = await params

  const log = await db.accountingSyncLog.findUnique({
    where: { id: logId },
    include: {
      connection: { select: { userId: true, provider: true, providerName: true } },
    },
  })

  if (!log) {
    return NextResponse.json({ error: 'Sync log not found' }, { status: 404 })
  }

  if (log.connection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let result: Awaited<ReturnType<typeof syncCustomer>>

  switch (log.entityType) {
    case SyncEntityType.CUSTOMER:
      result = await syncCustomer(log.connectionId, log.entityId)
      break
    case SyncEntityType.INVOICE:
      result = await syncInvoice(log.connectionId, log.entityId)
      break
    case SyncEntityType.CREDIT_NOTE:
      result = await syncCreditNote(log.connectionId, log.entityId)
      break
    default:
      return NextResponse.json(
        { error: `Retry not supported for entity type: ${log.entityType}` },
        { status: 400 },
      )
  }

  return NextResponse.json({
    provider: log.connection.provider,
    providerName: log.connection.providerName,
    status: result.skipped ? 'skipped' : result.success ? 'success' : 'error',
    externalId: result.externalId,
    error: result.error,
  })
}
