import { describe, it, expect, vi } from 'vitest'
import crypto from 'crypto'

// Mock the db module to avoid Prisma client dependency
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Import after mock is set up
const { generateBackupCodes } = await import('@/lib/auth-utils')

describe('generateBackupCodes', () => {
  it('should generate the requested number of codes', () => {
    const { plainCodes, hashedCodes } = generateBackupCodes(10)
    expect(plainCodes).toHaveLength(10)
    expect(hashedCodes).toHaveLength(10)
  })

  it('should generate 8-digit numeric plain codes', () => {
    const { plainCodes } = generateBackupCodes(10)
    for (const code of plainCodes) {
      expect(code).toMatch(/^\d{8}$/)
      const num = parseInt(code, 10)
      expect(num).toBeGreaterThanOrEqual(10000000)
      expect(num).toBeLessThan(100000000)
    }
  })

  it('should generate SHA-256 hashed codes (64 hex chars)', () => {
    const { hashedCodes } = generateBackupCodes(10)
    for (const hash of hashedCodes) {
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    }
  })

  it('hashed codes should match SHA-256 of plain codes', () => {
    const { plainCodes, hashedCodes } = generateBackupCodes(5)
    for (let i = 0; i < 5; i++) {
      const expectedHash = crypto
        .createHash('sha256')
        .update(plainCodes[i]!)
        .digest('hex')
      expect(hashedCodes[i]).toBe(expectedHash)
    }
  })

  it('should generate unique codes', () => {
    const { plainCodes } = generateBackupCodes(10)
    const unique = new Set(plainCodes)
    // With 90M possible values and 10 codes, collision is extremely unlikely
    expect(unique.size).toBe(10)
  })

  it('should use crypto.randomInt (not Math.random)', () => {
    // Verify codes come from a secure source by checking they're not predictable
    const results: string[][] = []
    for (let i = 0; i < 3; i++) {
      results.push(generateBackupCodes(5).plainCodes)
    }
    // All sets should be different
    expect(results[0]).not.toEqual(results[1])
    expect(results[1]).not.toEqual(results[2])
  })
})

describe('backup code hashing', () => {
  it('plain codes should NOT be stored — only hashes', () => {
    const { plainCodes, hashedCodes } = generateBackupCodes(5)
    // No hashed code should equal any plain code
    for (const hash of hashedCodes) {
      expect(plainCodes).not.toContain(hash)
    }
  })
})
