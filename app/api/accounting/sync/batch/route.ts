import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getActiveConnectionsForUser } from '@/lib/accounting/token-manager'
import { syncInvoice } from '@/lib/accounting/sync-service'

const SYNC_THRESHOLD = 10
const RATE_LIMIT_DELAY_MS = 200

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { invoiceIds?: unknown; connectionId?: unknown }
  const { invoiceIds, connectionId } = body

  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return NextResponse.json({ error: 'invoiceIds must be a non-empty array' }, { status: 400 })
  }

  const ids = invoiceIds as string[]

  // Verify ALL invoices belong to the current user in a single query
  const owned = await db.invoice.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    select: { id: true },
  })
  if (owned.length !== ids.length) {
    return NextResponse.json({ error: 'One or more invoices not found' }, { status: 404 })
  }

  const connections = await getActiveConnectionsForUser(session.user.id)
  const targets = typeof connectionId === 'string'
    ? connections.filter((c) => c.id === connectionId)
    : connections

  if (targets.length === 0) {
    return NextResponse.json(
      { error: typeof connectionId === 'string' ? 'Connection not found or not active' : 'No active accounting connections' },
      { status: 400 },
    )
  }

  if (ids.length <= SYNC_THRESHOLD) {
    const results: Array<{
      invoiceId: string
      provider: string
      providerName: string
      status: string
      externalId?: string
      error?: string
    }> = []

    for (let i = 0; i < ids.length; i++) {
      if (i > 0) await delay(RATE_LIMIT_DELAY_MS)
      const invoiceId = ids[i]!
      for (const connection of targets) {
        const result = await syncInvoice(connection.id, invoiceId)
        results.push({
          invoiceId,
          provider: connection.provider,
          providerName: connection.providerName,
          status: result.skipped ? 'skipped' : result.success ? 'success' : 'error',
          externalId: result.externalId,
          error: result.error,
        })
      }
    }

    return NextResponse.json({ results })
  }

  // Large batch: fire and forget
  void (async () => {
    for (let i = 0; i < ids.length; i++) {
      if (i > 0) await delay(RATE_LIMIT_DELAY_MS)
      const invoiceId = ids[i]!
      for (const connection of targets) {
        await syncInvoice(connection.id, invoiceId).catch(() => undefined)
      }
    }
  })()

  return NextResponse.json({ status: 'PENDING', count: ids.length })
}
