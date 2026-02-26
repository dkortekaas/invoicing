import { AccountingProvider } from '@prisma/client'
import type { AccountingAdapter } from './types'

/**
 * Returns the adapter for the given accounting provider.
 * Adapters are lazily imported so that provider-specific code is only loaded
 * when actually needed, keeping cold-start overhead minimal.
 *
 * @throws {Error} When the provider is not yet supported.
 */
export async function getAdapter(
  provider: AccountingProvider,
  accessToken: string,
  adminId?: string,
): Promise<AccountingAdapter> {
  switch (provider) {
    case AccountingProvider.MONEYBIRD: {
      const { MoneybirdAdapter } = await import('./adapters/moneybird')
      if (!adminId) throw new Error('adminId is required for the Moneybird adapter')
      return new MoneybirdAdapter(accessToken, adminId)
    }
    case AccountingProvider.EBOEKHOUDEN: {
      const { EboekhoudenAdapter } = await import('./providers/eboekhouden')
      return new EboekhoudenAdapter(accessToken)
    }
    case AccountingProvider.EXACT: {
      const { ExactAdapter } = await import('./providers/exact')
      return new ExactAdapter(accessToken)
    }
    case AccountingProvider.YUKI: {
      const { YukiAdapter } = await import('./providers/yuki')
      return new YukiAdapter(accessToken)
    }
    default: {
      // TypeScript exhaustiveness check — this branch is unreachable if all enum
      // values are handled above, but guards against future enum additions.
      const _exhaustive: never = provider
      throw new Error(`Accounting provider "${_exhaustive}" is not supported.`)
    }
  }
}
