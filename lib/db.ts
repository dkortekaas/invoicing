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

  // Create PostgreSQL connection pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)

  // PrismaClient with adapter for Prisma 7.x
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
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

// Create a proxy that maintains type safety
const dbHandler: ProxyHandler<PrismaClient> = {
  get(_target, prop) {
    const client = getDb()
    const value = (client as any)[prop]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
}

export const db = new Proxy({} as PrismaClient, dbHandler) as PrismaClient
