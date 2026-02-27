import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import { getAdapter } from '@/lib/accounting/adapter-factory'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { provider: rawProvider } = await params
  const provider = rawProvider.toUpperCase()

  if (!PROVIDER_VALUES.has(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/accounting/callback/${rawProvider}`

  // CSRF check
  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const queryState = request.nextUrl.searchParams.get('state')

  if (!storedState || storedState !== queryState) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 403 })
  }
  cookieStore.delete('oauth_state')

  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
  }

  // Exchange code → tokens (no adminId needed for this step)
  const initAdapter = await getAdapter(provider as AccountingProvider, '', '_init')
  const tokens = await initAdapter.exchangeCodeForTokens(code, redirectUri)

  // Fetch available administrations with the new access token
  const authedAdapter = await getAdapter(provider as AccountingProvider, tokens.accessToken, '_init')
  const administrations = await authedAdapter.getAdministrations()

  if (administrations.length === 1) {
    const admin = administrations[0]!

    await db.accountingConnection.upsert({
      where: { userId_provider: { userId: session.user.id, provider: provider as AccountingProvider } },
      create: {
        userId: session.user.id,
        provider: provider as AccountingProvider,
        providerName: PROVIDER_NAMES[provider as AccountingProvider],
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiresAt: tokenExpiresAt(tokens),
        externalAdminId: admin.id,
        externalUserId: admin.id,
        isActive: true,
      },
      update: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiresAt: tokenExpiresAt(tokens),
        externalAdminId: admin.id,
        externalUserId: admin.id,
        isActive: true,
        lastError: null,
      },
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings/accounting?connected=true', appUrl),
    )
  }

  // Multiple administrations: encrypt tokens into a short-lived cookie and let
  // the user pick which administration to connect from the UI.
  const pendingPayload = encrypt(JSON.stringify(tokens))
  cookieStore.set('oauth_pending_tokens', pendingPayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return NextResponse.redirect(
    new URL(`/dashboard/settings/accounting/select-admin?provider=${rawProvider}`, appUrl),
  )
}
