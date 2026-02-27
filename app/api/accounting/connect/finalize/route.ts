import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/crypto'
import type { TokenResponse } from '@/lib/accounting/types'

const PROVIDER_VALUES = new Set<string>(Object.values(AccountingProvider))

const PROVIDER_NAMES: Record<AccountingProvider, string> = {
  [AccountingProvider.MONEYBIRD]: 'Moneybird',
  [AccountingProvider.EBOEKHOUDEN]: 'e-Boekhouden',
  [AccountingProvider.EXACT]: 'Exact Online',
  [AccountingProvider.YUKI]: 'Yuki',
}

function tokenExpiresAt(tokens: TokenResponse): Date | null {
  if (tokens.expiresAt) return tokens.expiresAt
  if (tokens.expiresIn) return new Date(Date.now() + tokens.expiresIn * 1000)
  return null
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body.provider !== 'string' ||
    typeof body.adminId !== 'string' ||
    !body.adminId.trim()
  ) {
    return NextResponse.json({ error: 'Ongeldige gegevens' }, { status: 400 })
  }

  const providerKey = (body.provider as string).toUpperCase()
  if (!PROVIDER_VALUES.has(providerKey)) {
    return NextResponse.json({ error: 'Onbekende provider' }, { status: 400 })
  }

  const provider = providerKey as AccountingProvider
  const adminId = (body.adminId as string).trim()

  // Read and decrypt the short-lived pending tokens cookie
  const cookieStore = await cookies()
  const pendingCookie = cookieStore.get('oauth_pending_tokens')?.value
  if (!pendingCookie) {
    return NextResponse.json(
      { error: 'Geen openstaande tokens gevonden. Start de OAuth-koppeling opnieuw.' },
      { status: 400 },
    )
  }

  let tokens: TokenResponse
  try {
    tokens = JSON.parse(decrypt(pendingCookie)) as TokenResponse
  } catch {
    return NextResponse.json(
      { error: 'Ongeldige tokens. Start de OAuth-koppeling opnieuw.' },
      { status: 400 },
    )
  }

  // Persist the connection with the chosen administration
  await db.accountingConnection.upsert({
    where: { userId_provider: { userId: session.user.id, provider } },
    create: {
      userId: session.user.id,
      provider,
      providerName: PROVIDER_NAMES[provider],
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokenExpiresAt(tokens),
      externalAdminId: adminId,
      externalUserId: adminId,
      isActive: true,
    },
    update: {
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokenExpiresAt(tokens),
      externalAdminId: adminId,
      externalUserId: adminId,
      isActive: true,
      lastError: null,
    },
  })

  // Clear the pending tokens cookie now that the connection is saved
  cookieStore.delete('oauth_pending_tokens')

  return NextResponse.json({ success: true })
}
