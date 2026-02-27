import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getActiveConnectionsForUser } from '@/lib/accounting/token-manager'
import { syncCustomer } from '@/lib/accounting/sync-service'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const customer = await db.customer.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const connections = await getActiveConnectionsForUser(session.user.id)
  if (connections.length === 0) {
    return NextResponse.json({ error: 'No active accounting connections' }, { status: 400 })
  }

  const results = await Promise.all(
    connections.map(async (connection) => {
      const result = await syncCustomer(connection.id, id)
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
