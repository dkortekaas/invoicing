import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AccountingProvider } from '@prisma/client'
import { auth } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import { getAdapter } from '@/lib/accounting/adapter-factory'
import type { TokenResponse } from '@/lib/accounting/types'
import { SelectAdminForm } from './select-admin-form'

const PROVIDER_VALUES = new Set<string>(Object.values(AccountingProvider))

const PROVIDER_NAMES: Record<AccountingProvider, string> = {
  [AccountingProvider.MONEYBIRD]: 'Moneybird',
  [AccountingProvider.EBOEKHOUDEN]: 'e-Boekhouden',
  [AccountingProvider.EXACT]: 'Exact Online',
  [AccountingProvider.YUKI]: 'Yuki',
}

export default async function SelectAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { provider: rawProvider } = await searchParams
  if (!rawProvider) redirect('/dashboard/settings/accounting')

  const providerKey = rawProvider.toUpperCase()
  if (!PROVIDER_VALUES.has(providerKey)) redirect('/dashboard/settings/accounting')

  const provider = providerKey as AccountingProvider

  // Read pending tokens from the short-lived httpOnly cookie set by the callback route
  const cookieStore = await cookies()
  const pendingCookie = cookieStore.get('oauth_pending_tokens')?.value
  if (!pendingCookie) redirect('/dashboard/settings/accounting')

  let tokens: TokenResponse
  try {
    tokens = JSON.parse(decrypt(pendingCookie)) as TokenResponse
  } catch {
    redirect('/dashboard/settings/accounting')
  }

  // Fetch available administrations using the just-obtained access token
  let administrations: Array<{ id: string; name: string }>
  try {
    const adapter = await getAdapter(provider, tokens.accessToken, '_init')
    administrations = await adapter.getAdministrations()
  } catch {
    redirect('/dashboard/settings/accounting?error=admin_fetch_failed')
  }

  if (administrations.length === 0) {
    redirect('/dashboard/settings/accounting?error=no_administrations')
  }

  return (
    <SelectAdminForm
      provider={provider}
      providerName={PROVIDER_NAMES[provider]}
      administrations={administrations}
    />
  )
}
