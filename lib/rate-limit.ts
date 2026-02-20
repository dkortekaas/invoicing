/**
 * Rate limiter with Upstash Redis support for serverless environments.
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses
 * Upstash Redis via their REST API (no extra npm packages required). This
 * makes the limiter shared across all Vercel function instances.
 *
 * Falls back to an in-memory store when the env vars are absent (local dev,
 * CI, single-instance deployments).
 *
 * Usage:
 *   const { allowed } = await rateLimit(`login:${ip}`, RATE_LIMITS.login)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

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

function memoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(key, newEntry)
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: newEntry.resetAt }
  }

  entry.count++
  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt }
}

// ─── Upstash Redis (fixed-window via REST pipeline) ──────────────────────────

async function upstashRateLimit(
  key: string,
  options: RateLimitOptions,
  restUrl: string,
  restToken: string,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`

  try {
    // Atomic pipeline: INCR then TTL so we know whether to set expiry
    const pipeline = [["INCR", redisKey], ["TTL", redisKey]]
    const res = await fetch(`${restUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      // Fail fast — a slow Redis should not block the request indefinitely
      signal: AbortSignal.timeout(3_000),
    })

    if (!res.ok) {
      // Redis call failed; fail open to avoid blocking legitimate traffic
      console.warn(`[rate-limit] Upstash pipeline failed: ${res.status}`)
      return { allowed: true, remaining: options.maxRequests - 1, resetAt: Date.now() + options.windowSeconds * 1000 }
    }

    const results = (await res.json()) as [{ result: number }, { result: number }]
    const count = results[0].result
    const ttl = results[1].result

    // Key is new (no expiry set yet) → set window TTL
    if (ttl < 0) {
      fetch(`${restUrl}/expire/${encodeURIComponent(redisKey)}/${options.windowSeconds}`, {
        headers: { Authorization: `Bearer ${restToken}` },
      }).catch(() => { /* ignore */ })
    }

    const resetAt = Date.now() + (ttl > 0 ? ttl : options.windowSeconds) * 1000

    if (count > options.maxRequests) {
      return { allowed: false, remaining: 0, resetAt }
    }
    return { allowed: true, remaining: Math.max(0, options.maxRequests - count), resetAt }
  } catch (err) {
    // Network error / timeout — fail open
    console.warn("[rate-limit] Upstash error, failing open:", err)
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: Date.now() + options.windowSeconds * 1000 }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Rate-limit a key within a fixed time window.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * are configured (recommended for production / Vercel); falls back to an
 * in-memory store otherwise.
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (restUrl && restToken) {
    return upstashRateLimit(key, options, restUrl, restToken)
  }

  return memoryRateLimit(key, options)
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
