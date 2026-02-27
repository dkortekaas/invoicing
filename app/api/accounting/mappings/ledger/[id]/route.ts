import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const mapping = await db.ledgerMapping.findUnique({
    where: { id },
    select: { connection: { select: { userId: true } } },
  })

  if (!mapping) {
    return NextResponse.json({ error: 'Ledger mapping not found' }, { status: 404 })
  }

  if (mapping.connection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.ledgerMapping.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
