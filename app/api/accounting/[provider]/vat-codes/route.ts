import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAdapter } from '@/lib/accounting/adapter-factory'
import { withValidToken } from '@/lib/accounting/token-manager'
import { AccountingSyncError, SyncErrorType } from '@/lib/accounting/types'

const PROVIDER_VALUES = new Set<string>(Object.values(AccountingProvider))

export async function GET(
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

  const connection = await db.accountingConnection.findFirst({
    where: { userId: session.user.id, provider: provider as AccountingProvider, isActive: true },
  })

  if (!connection) {
    return NextResponse.json({ error: 'No active connection for this provider' }, { status: 404 })
  }

  try {
    const vatCodes = await withValidToken(connection, async (token) => {
      const adapter = await getAdapter(
        provider as AccountingProvider,
        token,
        connection.externalAdminId,
      )
      return adapter.getVatCodes()
    })

    return NextResponse.json({ vatCodes })
  } catch (error) {
    if (
      error instanceof AccountingSyncError &&
      error.errorType === SyncErrorType.AUTHENTICATION_FAILED
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch VAT codes' }, { status: 500 })
  }
}
