import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AccountingProvider } from '@prisma/client'
import { getCurrentUser } from '@/lib/get-session'
import { db } from '@/lib/db'
import { ProviderCard } from './provider-card'
import type { ProviderConfig, ConnectionSnapshot } from './provider-card'

export const dynamic = 'force-dynamic'

// ============================================================
// Provider configuration (static, hardcoded)
// ============================================================

const PROVIDERS: ProviderConfig[] = [
  {
    provider: AccountingProvider.MONEYBIRD,
    name: 'Moneybird',
    doelgroep: 'ZZP, klein MKB',
    accent: '#1E90FF',
    initials: 'MB',
  },
  {
    provider: AccountingProvider.EBOEKHOUDEN,
    name: 'e-Boekhouden',
    doelgroep: 'ZZP',
    accent: '#F28C00',
    initials: 'EB',
  },
  {
    provider: AccountingProvider.EXACT,
    name: 'Exact Online',
    doelgroep: 'MKB',
    accent: '#D40000',
    initials: 'EX',
  },
  {
    provider: AccountingProvider.YUKI,
    name: 'Yuki',
    doelgroep: 'Accountants, MKB',
    accent: '#6C3483',
    initials: 'YU',
  },
]

// ============================================================
// Page
// ============================================================

export default async function AccountingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const connections = await db.accountingConnection.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      provider: true,
      providerName: true,
      isActive: true,
      lastSyncAt: true,
    },
  })

  const connectionMap = new Map<AccountingProvider, ConnectionSnapshot>(
    connections.map((c) => [c.provider, c]),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Boekhoudkoppelingen</h2>
        <p className="text-muted-foreground">
          Synchroniseer facturen automatisch naar je boekhoudpakket. Eenrichtingsverkeer: van
          Declair naar je boekhouding.
        </p>
      </div>

      {/* Provider grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDERS.map((config) => (
          <ProviderCard
            key={config.provider}
            config={config}
            connection={connectionMap.get(config.provider) ?? null}
          />
        ))}
      </div>

      {/* Footer link */}
      <div>
        <Link
          href="/dashboard/settings/accounting/logs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Bekijk sync log
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
