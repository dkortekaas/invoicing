/**
 * Accounting integration cleanup utilities.
 *
 * Call revokeAllTokens(userId) before permanently deleting a User so that
 * active OAuth sessions at third-party providers are invalidated first.
 *
 * Usage in a user-deletion flow:
 *
 *   import { revokeAllTokens } from '@/lib/accounting/cleanup'
 *
 *   await revokeAllTokens(userId)     // best-effort, never throws
 *   await db.user.delete({ where: { id: userId } })  // cascade handles DB cleanup
 */

import { db } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { getAdapter } from './adapter-factory'

/**
 * Attempts to revoke OAuth tokens for every active accounting connection
 * belonging to `userId`.
 *
 * - Runs all revocations in parallel via Promise.allSettled so that a failure
 *   on one provider never blocks the others.
 * - Errors are silently discarded; token revocation is always best-effort.
 *   The DB cascade triggered by the subsequent User deletion will remove the
 *   AccountingConnection rows regardless.
 * - Only adapters that expose a `revokeToken()` method are called; API-key
 *   providers (Yuki, e-Boekhouden) are silently skipped.
 */
export async function revokeAllTokens(userId: string): Promise<void> {
  let connections: Array<{
    id: string
    provider: string
    accessToken: string
    externalAdminId: string
  }>

  try {
    connections = await db.accountingConnection.findMany({
      where: { userId, isActive: true },
      select: { id: true, provider: true, accessToken: true, externalAdminId: true },
    })
  } catch {
    // DB read failure — nothing to revoke
    return
  }

  await Promise.allSettled(
    connections.map(async (connection) => {
      try {
        const accessToken = decrypt(connection.accessToken)
        const adapter = await getAdapter(
          connection.provider as Parameters<typeof getAdapter>[0],
          accessToken,
          connection.externalAdminId,
        )
        if ('revokeToken' in adapter && typeof adapter.revokeToken === 'function') {
          await (adapter as { revokeToken: () => Promise<void> }).revokeToken()
        }
      } catch {
        // Ignore per-connection errors — best-effort only
      }
    }),
  )
}
