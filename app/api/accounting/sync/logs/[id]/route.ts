import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { SyncLogDetail } from '@/types/accounting'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const log = await db.accountingSyncLog.findUnique({
    where: { id },
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

  const { connection, ...rest } = log
  const response: SyncLogDetail = {
    ...rest,
    provider: connection.provider,
    providerName: connection.providerName,
  }

  return NextResponse.json(response)
}
