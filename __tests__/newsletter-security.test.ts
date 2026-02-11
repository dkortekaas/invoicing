import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

// Test the hashing function used in newsletter routes
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Test the HMAC unsubscribe token generation
function generateUnsubscribeToken(
  subscriberId: string,
  email: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`unsubscribe:${subscriberId}:${email}`)
    .digest('hex')
}

describe('newsletter token hashing', () => {
  it('should produce consistent SHA-256 hashes', () => {
    const token = 'abc123def456'
    const hash1 = hashToken(token)
    const hash2 = hashToken(token)
    expect(hash1).toBe(hash2)
  })

  it('should produce 64 character hex strings', () => {
    const token = crypto.randomBytes(32).toString('hex')
    const hash = hashToken(token)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('different tokens should produce different hashes', () => {
    const token1 = crypto.randomBytes(32).toString('hex')
    const token2 = crypto.randomBytes(32).toString('hex')
    expect(hashToken(token1)).not.toBe(hashToken(token2))
  })

  it('hashed token should NOT equal the plain token', () => {
    const token = crypto.randomBytes(32).toString('hex')
    expect(hashToken(token)).not.toBe(token)
  })
})

describe('newsletter unsubscribe HMAC token', () => {
  const secret = 'test-secret-key-12345'

  it('should produce consistent HMAC tokens', () => {
    const token1 = generateUnsubscribeToken('sub123', 'test@example.com', secret)
    const token2 = generateUnsubscribeToken('sub123', 'test@example.com', secret)
    expect(token1).toBe(token2)
  })

  it('should differ for different subscriber IDs', () => {
    const token1 = generateUnsubscribeToken('sub123', 'test@example.com', secret)
    const token2 = generateUnsubscribeToken('sub456', 'test@example.com', secret)
    expect(token1).not.toBe(token2)
  })

  it('should differ for different emails', () => {
    const token1 = generateUnsubscribeToken('sub123', 'alice@example.com', secret)
    const token2 = generateUnsubscribeToken('sub123', 'bob@example.com', secret)
    expect(token1).not.toBe(token2)
  })

  it('should differ for different secrets', () => {
    const token1 = generateUnsubscribeToken('sub123', 'test@example.com', 'secret1')
    const token2 = generateUnsubscribeToken('sub123', 'test@example.com', 'secret2')
    expect(token1).not.toBe(token2)
  })

  it('should be a valid HMAC-SHA256 output (64 hex chars)', () => {
    const token = generateUnsubscribeToken('sub123', 'test@example.com', secret)
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('CSV formula injection sanitization', () => {
  // Replicate the sanitize function from import-service
  function sanitizeCellValue(value: unknown): unknown {
    if (typeof value !== 'string') return value
    const dangerous = /^[=+\-@\t\r]/
    if (dangerous.test(value)) {
      return `'${value}`
    }
    return value
  }

  it('should prefix formula-starting strings with single quote', () => {
    expect(sanitizeCellValue('=CMD()')).toBe("'=CMD()")
    expect(sanitizeCellValue('+CMD()')).toBe("'+CMD()")
    expect(sanitizeCellValue('-CMD()')).toBe("'-CMD()")
    expect(sanitizeCellValue('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('should not modify safe strings', () => {
    expect(sanitizeCellValue('Hello World')).toBe('Hello World')
    expect(sanitizeCellValue('100.50')).toBe('100.50')
    // 'test@email.com' starts with 't', not '@', so it's safe
    expect(sanitizeCellValue('test@email.com')).toBe('test@email.com')
  })

  it('should pass through non-string values', () => {
    expect(sanitizeCellValue(123)).toBe(123)
    expect(sanitizeCellValue(null)).toBe(null)
    expect(sanitizeCellValue(undefined)).toBe(undefined)
    expect(sanitizeCellValue(true)).toBe(true)
  })
})
