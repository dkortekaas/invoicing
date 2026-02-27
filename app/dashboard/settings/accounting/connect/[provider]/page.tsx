import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { AccountingProvider } from '@prisma/client'
import { getCurrentUser } from '@/lib/get-session'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================
// Provider configuration
// ============================================================

interface ProviderInfo {
  name: string
  accent: string
  initials: string
  doelgroep: string
  permissions: string[]
}

const PROVIDER_INFO: Record<AccountingProvider, ProviderInfo> = {
  [AccountingProvider.MONEYBIRD]: {
    name: 'Moneybird',
    accent: '#1E90FF',
    initials: 'MB',
    doelgroep: 'ZZP, klein MKB',
    permissions: [
      'Contacten lezen en aanmaken',
      'Verkoopfacturen aanmaken',
      'Betalingen registreren',
      'Grootboekrekeningen uitlezen',
      'BTW-tarieven uitlezen',
    ],
  },
  [AccountingProvider.EBOEKHOUDEN]: {
    name: 'e-Boekhouden',
    accent: '#F28C00',
    initials: 'EB',
    doelgroep: 'ZZP',
    permissions: [
      'Contacten aanmaken',
      'Verkoopfacturen aanmaken',
      'Grootboekrekeningen uitlezen',
    ],
  },
  [AccountingProvider.EXACT]: {
    name: 'Exact Online',
    accent: '#D40000',
    initials: 'EX',
    doelgroep: 'MKB',
    permissions: [
      'Contacten lezen en aanmaken',
      'Verkoopfacturen aanmaken',
      'Betalingen registreren',
      'Grootboekrekeningen uitlezen',
      'BTW-tarieven uitlezen',
    ],
  },
  [AccountingProvider.YUKI]: {
    name: 'Yuki',
    accent: '#6C3483',
    initials: 'YU',
    doelgroep: 'Accountants, MKB',
    permissions: [
      'Contacten lezen en aanmaken',
      'Verkoopfacturen aanmaken',
      'Betalingen registreren',
      'Grootboekrekeningen uitlezen',
    ],
  },
}

const PROVIDER_VALUES = new Set<string>(Object.values(AccountingProvider))

// ============================================================
// Page
// ============================================================

export default async function ConnectProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { provider: rawProvider } = await params
  const providerKey = rawProvider.toUpperCase()

  if (!PROVIDER_VALUES.has(providerKey)) {
    redirect('/dashboard/settings/accounting')
  }

  const provider = providerKey as AccountingProvider

  // e-Boekhouden uses API credentials instead of OAuth
  if (provider === AccountingProvider.EBOEKHOUDEN) {
    redirect('/dashboard/settings/accounting/connect/eboekhouden')
  }

  const info = PROVIDER_INFO[provider]
  const providerSlug = rawProvider.toLowerCase()

  return (
    <div className="max-w-md space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/settings/accounting"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Boekhoudkoppelingen
      </Link>

      {/* Provider identity */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ backgroundColor: info.accent }}
        >
          {info.initials}
        </div>
        <div>
          <h2 className="text-xl font-bold">{info.name} verbinden</h2>
          <p className="text-muted-foreground text-sm">{info.doelgroep}</p>
        </div>
      </div>

      {/* Permissions card */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-3">Declair vraagt toestemming voor:</p>
          <ul className="space-y-2">
            {info.permissions.map((perm) => (
              <li key={perm} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                <span>{perm}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs mt-4">
            Declair synchroniseert alleen van Declair naar {info.name}. Er worden nooit gegevens
            zonder jouw toestemming gewijzigd.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard/settings/accounting">Annuleren</Link>
        </Button>
        {/* Plain <a> so the OAuth redirect is a full navigation, not a client-side route transition */}
        <a href={`/api/accounting/connect/${providerSlug}`}>
          <Button>Verbinden met {info.name}</Button>
        </a>
      </div>
    </div>
  )
}
