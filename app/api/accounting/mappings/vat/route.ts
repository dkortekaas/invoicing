import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mappings = await db.vatMapping.findMany({
    where: { connection: { userId: session.user.id } },
    include: { connection: { select: { provider: true, providerName: true } } },
    orderBy: [{ connectionId: 'asc' }, { vatRate: 'asc' }],
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
    vatRate?: number
    externalVatId?: string
    externalVatCode?: string | null
    externalVatName?: string | null
  } | null

  if (!body?.connectionId || body.vatRate === undefined || body.vatRate === null || !body.externalVatId) {
    return NextResponse.json(
      { error: 'connectionId, vatRate, and externalVatId are required' },
      { status: 400 },
    )
  }

  if (typeof body.vatRate !== 'number' || isNaN(body.vatRate)) {
    return NextResponse.json({ error: 'vatRate must be a number' }, { status: 400 })
  }

  // Verify the user owns this connection
  const connection = await db.accountingConnection.findUnique({
    where: { id: body.connectionId, userId: session.user.id },
    select: { id: true },
  })
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const mapping = await db.vatMapping.upsert({
    where: {
      connectionId_vatRate: {
        connectionId: body.connectionId,
        vatRate: body.vatRate,
      },
    },
    create: {
      connectionId: body.connectionId,
      vatRate: body.vatRate,
      externalVatId: body.externalVatId,
      externalVatCode: body.externalVatCode ?? null,
      externalVatName: body.externalVatName ?? null,
    },
    update: {
      externalVatId: body.externalVatId,
      externalVatCode: body.externalVatCode ?? null,
      externalVatName: body.externalVatName ?? null,
    },
  })

  return NextResponse.json(mapping, { status: 201 })
}
