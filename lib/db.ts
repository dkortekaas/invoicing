import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set in environment variables.\n\n" +
        "Please create a .env file in the invoice-app directory with:\n" +
        "DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public\n\n" +
        "Or set DATABASE_URL in your environment variables."
    )
  }

  // Normalize DATABASE_URL to explicitly set sslmode=verify-full to avoid warnings
  let connectionString = process.env.DATABASE_URL
  try {
    const url = new URL(connectionString)
    const params = new URLSearchParams(url.search)
    
    // Always explicitly set sslmode=verify-full to avoid deprecation warnings
    // This ensures we use the secure mode and avoid the warning about prefer/require/verify-ca
    params.set('sslmode', 'verify-full')
    url.search = params.toString()
    connectionString = url.toString()
  } catch (error) {
    // If URL parsing fails, try to append sslmode if it's a simple connection string
    // This handles cases where the connection string might not be a standard URL
    if (connectionString && !connectionString.includes('sslmode=')) {
      const separator = connectionString.includes('?') ? '&' : '?'
      connectionString = `${connectionString}${separator}sslmode=verify-full`
    }
  }

  // Create PostgreSQL connection pool
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  // PrismaClient with adapter for Prisma 7.x
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

function getPrismaClient(): PrismaClient {
  // In development, clear cached client if it exists to ensure we get the latest models
  // This is important after running migrations
  if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
    // Don't clear if we're in the same process - only clear on module reload
    // The proxy will handle getting the latest client
  }

  const client = createPrismaClient()

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
  }

  return client
}

// Lazy initialization using a getter function
// This ensures PrismaClient is only created when actually accessed
let _db: PrismaClient | null = null

function getDb(): PrismaClient {
  if (!_db) {
    _db = getPrismaClient()
  }
  return _db
}

// Function to clear the cached client (useful after migrations)
export function clearPrismaCache() {
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = undefined
  }
  _db = null
}

// Create a proxy that maintains type safety
const dbHandler: ProxyHandler<PrismaClient> = {
  get(_target, prop: string | symbol) {
    const client = getDb()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    
    // If the property doesn't exist, it might be a new model that wasn't in the cached client
    // In development, try to get a fresh client
    if (value === undefined && process.env.NODE_ENV !== "production") {
      // Clear cache and try again
      clearPrismaCache()
      const freshClient = getDb()
      const freshValue = (freshClient as unknown as Record<string | symbol, unknown>)[prop]
      if (freshValue !== undefined) {
        if (typeof freshValue === "function") {
          return freshValue.bind(freshClient)
        }
        return freshValue
      }
      
      // If still undefined, throw a helpful error
      throw new Error(
        `Prisma model "${String(prop)}" not found. ` +
        `This usually means the Prisma client needs to be regenerated or the dev server needs to be restarted. ` +
        `Please run: npx prisma generate && restart your dev server`
      )
    }
    
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
}

export const db = new Proxy({} as PrismaClient, dbHandler) as PrismaClient
