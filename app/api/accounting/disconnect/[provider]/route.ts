import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { getAdapter } from '@/lib/accounting/adapter-factory'

const PROVIDER_VALUES = new Set<string>(Object.values(AccountingProvider))

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider: rawProvider } = await params
  const provider = rawProvider.toUpperCase()

  if (!PROVIDER_VALUES.has(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const connection = await db.accountingConnection.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: provider as AccountingProvider } },
  })

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  if (connection.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Best-effort token revocation — never fail the disconnect on revoke errors
  try {
    const accessToken = decrypt(connection.accessToken)
    const adapter = await getAdapter(
      provider as AccountingProvider,
      accessToken,
      connection.externalAdminId,
    )
    if ('revokeToken' in adapter && typeof adapter.revokeToken === 'function') {
      await (adapter as { revokeToken: () => Promise<void> }).revokeToken()
    }
  } catch {
    // Ignore — revoke is best effort
  }

  await db.accountingConnection.delete({ where: { id: connection.id } })

  return NextResponse.json({ success: true })
}
