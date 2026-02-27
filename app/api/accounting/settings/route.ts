import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const SETTINGS_SELECT = {
  id: true,
  provider: true,
  providerName: true,
  isActive: true,
  autoSyncInvoices: true,
  autoSyncCreditNotes: true,
  autoSyncCustomers: true,
  existingCustomerStrategy: true,
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await db.accountingConnection.findMany({
    where: { userId: session.user.id },
    select: SETTINGS_SELECT,
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
    existingCustomerStrategy?: string
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

  const VALID_STRATEGIES = new Set(['FIND_BY_EMAIL', 'ALWAYS_CREATE', 'ASK'])
  if (
    body.existingCustomerStrategy !== undefined &&
    !VALID_STRATEGIES.has(body.existingCustomerStrategy)
  ) {
    return NextResponse.json(
      { error: 'Invalid existingCustomerStrategy value' },
      { status: 400 },
    )
  }

  const updated = await db.accountingConnection.update({
    where: { id: body.connectionId },
    data: {
      ...(body.autoSyncInvoices !== undefined ? { autoSyncInvoices: body.autoSyncInvoices } : {}),
      ...(body.autoSyncCreditNotes !== undefined ? { autoSyncCreditNotes: body.autoSyncCreditNotes } : {}),
      ...(body.autoSyncCustomers !== undefined ? { autoSyncCustomers: body.autoSyncCustomers } : {}),
      ...(body.providerName !== undefined ? { providerName: body.providerName } : {}),
      ...(body.existingCustomerStrategy !== undefined
        ? { existingCustomerStrategy: body.existingCustomerStrategy }
        : {}),
    },
    select: SETTINGS_SELECT,
  })

  return NextResponse.json(updated)
}
