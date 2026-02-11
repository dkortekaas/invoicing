import { describe, it, expect } from 'vitest'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('should allow requests within the limit', () => {
    const key = `test-allow-${Date.now()}`
    const result = rateLimit(key, { maxRequests: 3, windowSeconds: 60 })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('should block requests exceeding the limit', () => {
    const key = `test-block-${Date.now()}`
    const options = { maxRequests: 2, windowSeconds: 60 }

    rateLimit(key, options) // 1
    rateLimit(key, options) // 2
    const result = rateLimit(key, options) // 3 — should be blocked

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should track remaining correctly', () => {
    const key = `test-remaining-${Date.now()}`
    const options = { maxRequests: 5, windowSeconds: 60 }

    const r1 = rateLimit(key, options)
    expect(r1.remaining).toBe(4)

    const r2 = rateLimit(key, options)
    expect(r2.remaining).toBe(3)

    const r3 = rateLimit(key, options)
    expect(r3.remaining).toBe(2)
  })

  it('should use different windows for different keys', () => {
    const key1 = `test-key1-${Date.now()}`
    const key2 = `test-key2-${Date.now()}`
    const options = { maxRequests: 1, windowSeconds: 60 }

    rateLimit(key1, options)
    const r1 = rateLimit(key1, options)
    expect(r1.allowed).toBe(false)

    const r2 = rateLimit(key2, options)
    expect(r2.allowed).toBe(true)
  })

  it('should provide a resetAt timestamp in the future', () => {
    const key = `test-reset-${Date.now()}`
    const result = rateLimit(key, { maxRequests: 5, windowSeconds: 60 })

    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it('should have sensible presets', () => {
    expect(RATE_LIMITS.login.maxRequests).toBe(5)
    expect(RATE_LIMITS.login.windowSeconds).toBe(900)
    expect(RATE_LIMITS.contact.maxRequests).toBe(3)
    expect(RATE_LIMITS.passwordReset.maxRequests).toBe(3)
  })
})
