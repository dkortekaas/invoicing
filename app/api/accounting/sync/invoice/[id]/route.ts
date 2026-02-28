import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getActiveConnectionsForUser } from '@/lib/accounting/token-manager'
import { syncInvoice } from '@/lib/accounting/sync-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({})) as { connectionId?: string }
  const { connectionId } = body

  const connections = await getActiveConnectionsForUser(session.user.id)
  const targets = connectionId
    ? connections.filter((c) => c.id === connectionId)
    : connections

  if (targets.length === 0) {
    return NextResponse.json(
      { error: connectionId ? 'Connection not found or not active' : 'No active accounting connections' },
      { status: 400 },
    )
  }

  const results = await Promise.all(
    targets.map(async (connection) => {
      const result = await syncInvoice(connection.id, id)
      return {
        provider: connection.provider,
        providerName: connection.providerName,
        status: result.skipped ? 'skipped' : result.success ? 'success' : 'error',
        externalId: result.externalId,
        error: result.error,
      }
    }),
  )

  return NextResponse.json({ results })
}
