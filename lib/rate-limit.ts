/**
 * In-memory rate limiter for protecting sensitive endpoints.
 *
 * Works out of the box for single-instance deployments (Vercel serverless
 * functions each get their own memory, so this acts as a per-instance limiter
 * which still provides meaningful protection against automated attacks).
 *
 * For multi-instance production with shared state:
 *   1. npm install @upstash/redis
 *   2. Set REDIS_URL and REDIS_TOKEN env vars
 *   3. Replace the MemoryStore with a Redis-backed store
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodically clean up expired entries to prevent memory leaks
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)
// Allow Node to exit even if timer is running
if (cleanupTimer.unref) {
  cleanupTimer.unref()
}

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
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const entry = store.get(key)

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
