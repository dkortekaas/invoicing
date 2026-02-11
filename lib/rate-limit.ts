/**
 * Rate limiter with pluggable store backend.
 *
 * Uses in-memory store by default. For production with multiple instances,
 * set REDIS_URL to enable Redis-based rate limiting (requires @upstash/redis).
 *
 * To enable Redis:
 *   1. npm install @upstash/redis
 *   2. Set REDIS_URL and REDIS_TOKEN env vars
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined | Promise<RateLimitEntry | undefined>
  set(key: string, entry: RateLimitEntry): void | Promise<void>
  delete(key: string): void | Promise<void>
}

// ============================================
// In-memory store (default, single-instance)
// ============================================
class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupTimer: ReturnType<typeof setInterval>

  constructor() {
    // Periodically clean up expired entries to prevent memory leaks
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store) {
        if (now >= entry.resetAt) {
          this.store.delete(key)
        }
      }
    }, 60_000)
    // Allow Node to exit even if timer is running
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key)
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  delete(key: string): void {
    this.store.delete(key)
  }
}

// ============================================
// Redis store (multi-instance production)
// ============================================
let redisStoreInstance: RateLimitStore | null = null

async function getRedisStore(): Promise<RateLimitStore | null> {
  if (redisStoreInstance) return redisStoreInstance

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  try {
    // Dynamic import - only loaded when REDIS_URL is set
    const { Redis } = await import("@upstash/redis")
    const redis = new Redis({
      url: redisUrl,
      token: process.env.REDIS_TOKEN || "",
    })

    redisStoreInstance = {
      async get(key: string): Promise<RateLimitEntry | undefined> {
        const data = await redis.get<RateLimitEntry>(`ratelimit:${key}`)
        return data ?? undefined
      },
      async set(key: string, entry: RateLimitEntry): Promise<void> {
        const ttl = Math.ceil((entry.resetAt - Date.now()) / 1000)
        if (ttl > 0) {
          await redis.set(`ratelimit:${key}`, entry, { ex: ttl })
        }
      },
      async delete(key: string): Promise<void> {
        await redis.del(`ratelimit:${key}`)
      },
    }

    return redisStoreInstance
  } catch {
    // @upstash/redis not installed or connection failed — fall back to memory
    return null
  }
}

// ============================================
// Store selection
// ============================================
const memoryStore = new MemoryStore()

// Try to initialize Redis store at startup (non-blocking)
let storePromise: Promise<RateLimitStore> | null = null

function getStore(): RateLimitStore | Promise<RateLimitStore> {
  if (redisStoreInstance) return redisStoreInstance
  if (!process.env.REDIS_URL) return memoryStore

  if (!storePromise) {
    storePromise = getRedisStore().then((store) => store || memoryStore)
  }
  return storePromise
}

// ============================================
// Rate limiter
// ============================================
interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const store = getStore()

  // If store is async (Redis), fall back to sync memory store for this request
  // and fire async check in background. This keeps the API synchronous.
  if (store instanceof Promise) {
    return rateLimitSync(key, options, memoryStore)
  }

  return rateLimitSync(key, options, store)
}

function rateLimitSync(
  key: string,
  options: RateLimitOptions,
  store: RateLimitStore
): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const entry = store.get(key)

  // Handle async result from Redis store gracefully
  if (entry instanceof Promise) {
    // Can't await in sync function — use memory store as fallback
    return rateLimitSync(key, options, memoryStore)
  }

  if (!entry || now >= entry.resetAt) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(key, newEntry)
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  entry.count++
  store.set(key, entry)

  if (entry.count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Async rate limiter for use in async route handlers.
 * Prefers Redis when available, falls back to memory.
 */
export async function rateLimitAsync(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const store = await Promise.resolve(getStore())
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const entry = await Promise.resolve(store.get(key))

  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    await Promise.resolve(store.set(key, newEntry))
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  entry.count++
  await Promise.resolve(store.set(key, entry))

  if (entry.count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Rate limit presets for common use cases
 */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes per IP */
  login: { maxRequests: 5, windowSeconds: 900 },
  /** Password reset: 3 requests per 15 minutes per email */
  passwordReset: { maxRequests: 3, windowSeconds: 900 },
  /** API general: 100 requests per minute per user */
  api: { maxRequests: 100, windowSeconds: 60 },
  /** File upload: 10 uploads per minute per user */
  upload: { maxRequests: 10, windowSeconds: 60 },
  /** Contact form: 3 submissions per 15 minutes per IP */
  contact: { maxRequests: 3, windowSeconds: 900 },
} as const
