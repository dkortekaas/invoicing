import { NextResponse } from 'next/server'
import { InvoiceStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/accounting/sync/unsynced-count
 *
 * Returns the count and basic details of non-draft invoices that have no
 * SyncedInvoice record for any of the user's active accounting connections.
 * Capped at 100 results to keep the response lean for the dashboard widget.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const activeConnections = await db.accountingConnection.findMany({
    where: { userId, isActive: true },
    select: { id: true },
  })

  if (activeConnections.length === 0) {
    return NextResponse.json({ count: 0, invoices: [] })
  }

  const connectionIds = activeConnections.map((c) => c.id)

  const invoices = await db.invoice.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { not: InvoiceStatus.DRAFT },
      syncedAccounting: {
        none: {
          connectionId: { in: connectionIds },
        },
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
    },
    orderBy: { invoiceDate: 'desc' },
    take: 100,
  })

  return NextResponse.json({ count: invoices.length, invoices })
}
