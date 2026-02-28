import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt, generateKey } from './crypto'

const TEST_KEY = generateKey()

describe('encrypt / decrypt', () => {
  it('roundtrip returns the original string', () => {
    const plaintext = 'super-secret-oauth-token'
    expect(decrypt(encrypt(plaintext, TEST_KEY), TEST_KEY)).toBe(plaintext)
  })

  it('two encrypt() calls on the same input produce different ciphertext (random IV)', () => {
    const plaintext = 'same-input'
    const first = encrypt(plaintext, TEST_KEY)
    const second = encrypt(plaintext, TEST_KEY)
    expect(first).not.toBe(second)
  })

  it('different keys produce different ciphertext', () => {
    const key2 = generateKey()
    const ct1 = encrypt('same plaintext', TEST_KEY)
    const ct2 = encrypt('same plaintext', key2)
    expect(ct1).not.toBe(ct2)
  })

  it('decrypt() with wrong key throws', () => {
    const ciphertext = encrypt('hello', TEST_KEY)
    const wrongKey = generateKey()
    expect(() => decrypt(ciphertext, wrongKey)).toThrow(/Decryption failed/)
  })

  it('empty string roundtrip works', () => {
    expect(decrypt(encrypt('', TEST_KEY), TEST_KEY)).toBe('')
  })

  it('very long string (10 000 chars) roundtrip works', () => {
    const long = 'x'.repeat(10_000)
    expect(decrypt(encrypt(long, TEST_KEY), TEST_KEY)).toBe(long)
  })

  it('string with unicode characters roundtrip works', () => {
    const unicode = '€ café naïve résumé 中文 🔐'
    expect(decrypt(encrypt(unicode, TEST_KEY), TEST_KEY)).toBe(unicode)
  })
})

describe('output format', () => {
  it('returns a single string (not raw binary)', () => {
    const result = encrypt('test', TEST_KEY)
    expect(typeof result).toBe('string')
  })

  it('is formatted as three colon-separated base64 parts (iv:authTag:ciphertext)', () => {
    const parts = encrypt('test', TEST_KEY).split(':')
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      // Each segment must be valid base64
      expect(() => Buffer.from(part, 'base64')).not.toThrow()
      expect(part.length).toBeGreaterThan(0)
    }
  })

  it('throws for ciphertext with wrong number of parts', () => {
    expect(() => decrypt('onlyonepart', TEST_KEY)).toThrow()
    expect(() => decrypt('part1:part2', TEST_KEY)).toThrow()
  })
})

describe('ENCRYPTION_KEY env var', () => {
  let original: string | undefined

  beforeEach(() => {
    original = process.env.ENCRYPTION_KEY
  })

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ENCRYPTION_KEY
    } else {
      process.env.ENCRYPTION_KEY = original
    }
  })

  it('missing ENCRYPTION_KEY throws with a clear message', () => {
    delete process.env.ENCRYPTION_KEY
    expect(() => encrypt('text')).toThrow(/ENCRYPTION_KEY is not set/)
  })

  it('short ENCRYPTION_KEY throws with a clear message', () => {
    process.env.ENCRYPTION_KEY = 'tooshort'
    expect(() => encrypt('text')).toThrow(/64 hex characters/)
  })

  it('non-hex ENCRYPTION_KEY throws with a clear message', () => {
    process.env.ENCRYPTION_KEY = 'z'.repeat(64)
    expect(() => encrypt('text')).toThrow(/64 hex characters/)
  })

  it('falls back to process.env.ENCRYPTION_KEY when no key argument is provided', () => {
    process.env.ENCRYPTION_KEY = TEST_KEY
    const ciphertext = encrypt('env-key-test')
    expect(decrypt(ciphertext)).toBe('env-key-test')
  })

  it('invalid key length throws with a clear message', () => {
    expect(() => encrypt('text', 'tooshort')).toThrow(/64 hex characters/)
  })
})

describe('generateKey', () => {
  it('returns a 64-char hex string', () => {
    expect(generateKey()).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns a different value on each call', () => {
    expect(generateKey()).not.toBe(generateKey())
  })

  it('generated key works as explicit key argument', () => {
    const key = generateKey()
    expect(decrypt(encrypt('generated key roundtrip', key), key)).toBe('generated key roundtrip')
  })
})
