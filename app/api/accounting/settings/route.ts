import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await db.accountingConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      providerName: true,
      isActive: true,
      autoSyncInvoices: true,
      autoSyncCreditNotes: true,
      autoSyncCustomers: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ connections })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    connectionId?: string
    autoSyncInvoices?: boolean
    autoSyncCreditNotes?: boolean
    autoSyncCustomers?: boolean
    providerName?: string
  } | null

  if (!body?.connectionId) {
    return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
  }

  // Verify ownership before update
  const connection = await db.accountingConnection.findUnique({
    where: { id: body.connectionId, userId: session.user.id },
    select: { id: true },
  })
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const updated = await db.accountingConnection.update({
    where: { id: body.connectionId },
    data: {
      ...(body.autoSyncInvoices !== undefined ? { autoSyncInvoices: body.autoSyncInvoices } : {}),
      ...(body.autoSyncCreditNotes !== undefined ? { autoSyncCreditNotes: body.autoSyncCreditNotes } : {}),
      ...(body.autoSyncCustomers !== undefined ? { autoSyncCustomers: body.autoSyncCustomers } : {}),
      ...(body.providerName !== undefined ? { providerName: body.providerName } : {}),
    },
    select: {
      id: true,
      provider: true,
      providerName: true,
      isActive: true,
      autoSyncInvoices: true,
      autoSyncCreditNotes: true,
      autoSyncCustomers: true,
    },
  })

  return NextResponse.json(updated)
}
