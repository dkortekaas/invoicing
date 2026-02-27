import { NextResponse } from 'next/server'
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
      provider: true,
      providerName: true,
      isActive: true,
      lastSyncAt: true,
      lastError: true,
      externalAdminId: true,
    },
  })

  return NextResponse.json(connections)
}
