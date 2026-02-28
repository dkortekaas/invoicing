import type { AccountingConnection, Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/crypto'
import { getAdapter } from './adapter-factory'
import { AccountingSyncError, SyncErrorType, type TokenResponse } from './types'

// ============================================================
// Internal Constants
// ============================================================

const FIVE_MINUTES_MS = 5 * 60 * 1000

// ============================================================
// Return Types
// ============================================================

export type ConnectionWithRelations = Prisma.AccountingConnectionGetPayload<{
  include: { user: true; vatMappings: true; ledgerMappings: true }
}>

export type ConnectionWithMappings = Prisma.AccountingConnectionGetPayload<{
  include: { vatMappings: true; ledgerMappings: true }
}>

// ============================================================
// Exported Functions
// ============================================================

/**
 * Ensures the access token is valid before calling `fn`.
 * Automatically refreshes the token if it expires within 5 minutes.
 * Marks the connection as inactive and throws AccountingSyncError on
 * refresh failure.
 */
export async function withValidToken<T>(
  connection: AccountingConnection,
  fn: (token: string) => Promise<T>,
): Promise<T> {
  let accessToken = decrypt(connection.accessToken)

  const isExpiringSoon =
    connection.tokenExpiresAt !== null &&
    connection.tokenExpiresAt.getTime() < Date.now() + FIVE_MINUTES_MS

  if (isExpiringSoon) {
    try {
      if (!connection.refreshToken) {
        throw new Error('No refresh token available')
      }

      const adapter = await getAdapter(connection.provider, accessToken, connection.externalAdminId)
      const decryptedRefreshToken = decrypt(connection.refreshToken)
      const newTokens = await adapter.refreshAccessToken(decryptedRefreshToken)

      await updateConnectionTokens(connection.id, newTokens)
      accessToken = newTokens.accessToken
    } catch {
      await db.accountingConnection
        .update({ where: { id: connection.id }, data: { isActive: false } })
        .catch(() => undefined)

      throw new AccountingSyncError(
        `Koppeling met ${connection.providerName} verlopen. Ga naar Instellingen > Boekhoudkoppelingen om opnieuw te verbinden.`,
        SyncErrorType.AUTHENTICATION_FAILED,
      )
    }
  }

  return fn(accessToken)
}

/**
 * Persists new OAuth tokens to the database.
 * Encrypts both the access token and (if provided) the refresh token.
 * Calculates `tokenExpiresAt` from `expiresAt` or `expiresIn`.
 * Passing `undefined` for a field leaves the existing database value unchanged.
 */
export async function updateConnectionTokens(
  connectionId: string,
  tokens: TokenResponse,
): Promise<void> {
  const encryptedAccessToken = encrypt(tokens.accessToken)
  const encryptedRefreshToken = tokens.refreshToken
    ? encrypt(tokens.refreshToken)
    : undefined

  let tokenExpiresAt: Date | undefined
  if (tokens.expiresAt) {
    tokenExpiresAt = tokens.expiresAt
  } else if (tokens.expiresIn) {
    tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000)
  }

  await db.accountingConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt,
    },
  })
}

/**
 * Loads and validates a connection by ID.
 * Throws if not found or if the connection is marked inactive.
 */
export async function validateConnection(connectionId: string): Promise<ConnectionWithRelations> {
  const connection = await db.accountingConnection.findUnique({
    where: { id: connectionId },
    include: { user: true, vatMappings: true, ledgerMappings: true },
  })

  if (!connection) {
    throw new Error('Connection not found')
  }

  if (!connection.isActive) {
    throw new AccountingSyncError(
      `Koppeling met ${connection.providerName} is niet actief. Ga naar Instellingen > Boekhoudkoppelingen om opnieuw te verbinden.`,
      SyncErrorType.AUTHENTICATION_FAILED,
    )
  }

  return connection
}

/**
 * Returns all active accounting connections for a user,
 * including VAT and ledger mappings needed for sync operations.
 */
export async function getActiveConnectionsForUser(userId: string): Promise<ConnectionWithMappings[]> {
  return db.accountingConnection.findMany({
    where: { userId, isActive: true },
    include: { vatMappings: true, ledgerMappings: true },
  })
}
