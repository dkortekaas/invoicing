import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { getAdapter } from '@/lib/accounting/adapter-factory'

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

  const state = randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/accounting/callback/${rawProvider}`

  // Pass '_init' as adminId placeholder — getAuthUrl does not use it
  const adapter = await getAdapter(provider as AccountingProvider, '', '_init')
  const authUrl = adapter.getAuthUrl(redirectUri, state)

  return NextResponse.redirect(authUrl)
}
