import { AccountingProvider } from '@prisma/client'
import type { AccountingAdapter } from './types'

/**
 * Returns the adapter for the given accounting provider.
 * Adapters are lazily imported so that provider-specific code is only loaded
 * when actually needed, keeping cold-start overhead minimal.
 *
 * @throws {Error} When the provider is not yet supported.
 */
export async function getAdapter(provider: AccountingProvider): Promise<AccountingAdapter> {
  switch (provider) {
    case AccountingProvider.MONEYBIRD: {
      const { MoneybirdAdapter } = await import('./providers/moneybird')
      return new MoneybirdAdapter()
    }
    case AccountingProvider.EBOEKHOUDEN: {
      const { EboekhoudenAdapter } = await import('./providers/eboekhouden')
      return new EboekhoudenAdapter()
    }
    case AccountingProvider.EXACT: {
      const { ExactAdapter } = await import('./providers/exact')
      return new ExactAdapter()
    }
    case AccountingProvider.YUKI: {
      const { YukiAdapter } = await import('./providers/yuki')
      return new YukiAdapter()
    }
    default: {
      // TypeScript exhaustiveness check — this branch is unreachable if all enum
      // values are handled above, but guards against future enum additions.
      const _exhaustive: never = provider
      throw new Error(`Accounting provider "${_exhaustive}" is not supported.`)
    }
  }
}
