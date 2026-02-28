import { NextRequest, NextResponse } from 'next/server'
import { LedgerSourceType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const SOURCE_TYPE_VALUES = new Set<string>(Object.values(LedgerSourceType))

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mappings = await db.ledgerMapping.findMany({
    where: { connection: { userId: session.user.id } },
    include: { connection: { select: { provider: true, providerName: true } } },
    orderBy: [{ connectionId: 'asc' }, { sourceType: 'asc' }],
  })

  return NextResponse.json({ mappings })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    connectionId?: string
    sourceType?: string
    sourceId?: string | null
    externalLedgerId?: string
    externalLedgerCode?: string | null
    externalLedgerName?: string | null
  } | null

  if (!body?.connectionId || !body.sourceType || !body.externalLedgerId) {
    return NextResponse.json(
      { error: 'connectionId, sourceType, and externalLedgerId are required' },
      { status: 400 },
    )
  }

  if (!SOURCE_TYPE_VALUES.has(body.sourceType)) {
    return NextResponse.json(
      { error: `Invalid sourceType. Must be one of: ${[...SOURCE_TYPE_VALUES].join(', ')}` },
      { status: 400 },
    )
  }

  // Verify the user owns this connection
  const connection = await db.accountingConnection.findUnique({
    where: { id: body.connectionId, userId: session.user.id },
    select: { id: true },
  })
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const sourceType = body.sourceType as LedgerSourceType
  const sourceId = body.sourceId ?? null

  // Prisma's compound-unique where doesn't accept null for nullable fields;
  // use findFirst + create/update instead.
  const existing = await db.ledgerMapping.findFirst({
    where: { connectionId: body.connectionId, sourceType, sourceId },
  })

  const mappingData = {
    externalLedgerId: body.externalLedgerId,
    externalLedgerCode: body.externalLedgerCode ?? null,
    externalLedgerName: body.externalLedgerName ?? null,
  }

  const mapping = existing
    ? await db.ledgerMapping.update({ where: { id: existing.id }, data: mappingData })
    : await db.ledgerMapping.create({
        data: { connectionId: body.connectionId, sourceType, sourceId, ...mappingData },
      })

  return NextResponse.json(mapping, { status: 201 })
}
