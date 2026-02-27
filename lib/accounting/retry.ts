import { AccountingSyncError, SyncErrorType } from './types'

// ============================================================
// Types
// ============================================================

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

// ============================================================
// Constants
// ============================================================

export const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
}

// ============================================================
// Helpers
// ============================================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof AccountingSyncError) {
    return (
      error.errorType !== SyncErrorType.VALIDATION_ERROR &&
      error.errorType !== SyncErrorType.AUTHENTICATION_FAILED
    )
  }
  return true
}

// ============================================================
// withRetry
// ============================================================

/**
 * Retries `fn` up to `config.maxRetries` times using exponential back-off
 * with random jitter.
 *
 * Delay formula: min(initialDelay * backoffMultiplier^attempt, maxDelay) + jitter(0–100ms)
 * When a RATE_LIMITED error carries a `retryAfter` value the provider-supplied
 * seconds are used as the base delay instead.
 *
 * Never retries VALIDATION_ERROR or AUTHENTICATION_FAILED (by default).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  shouldRetry?: (error: unknown) => boolean,
): Promise<T> {
  const cfg: RetryConfig = { ...RETRY_CONFIG, ...config }
  const canRetry = shouldRetry ?? defaultShouldRetry

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === cfg.maxRetries

      if (isLastAttempt || !canRetry(error)) {
        throw error
      }

      let delayMs: number

      // Honour provider-supplied retry-after for rate limiting
      if (
        error instanceof AccountingSyncError &&
        error.retryAfter !== undefined
      ) {
        delayMs = error.retryAfter * 1000
      } else {
        delayMs = Math.min(
          cfg.initialDelayMs * Math.pow(cfg.backoffMultiplier, attempt),
          cfg.maxDelayMs,
        )
      }

      // Add jitter: 0–100ms
      delayMs += Math.random() * 100

      console.warn(
        `[withRetry] Attempt ${attempt + 1}/${cfg.maxRetries} failed — ` +
          `retrying in ${Math.round(delayMs)}ms: ` +
          (error instanceof Error ? error.message : String(error)),
      )

      await sleep(delayMs)
    }
  }

  // Unreachable, but satisfies the TypeScript control-flow checker
  throw new Error('withRetry: exhausted retries without throwing or returning')
}
