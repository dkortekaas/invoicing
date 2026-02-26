import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16

function resolveKey(key?: string): Buffer {
  const raw = key ?? process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY is not set. Generate one with generateKey() and add it to your environment variables.'
    )
  }
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Generate a valid key with generateKey().'
    )
  }
  return Buffer.from(raw, 'hex')
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt.
 * @param key - Optional 64-char hex key. Defaults to process.env.ENCRYPTION_KEY.
 * @returns A colon-separated string: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encrypt(plaintext: string, key?: string): string {
  const keyBuf = resolveKey(key)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBuf, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

/**
 * Decrypts a ciphertext string produced by {@link encrypt}.
 *
 * @param ciphertext - The colon-separated string: base64(iv):base64(authTag):base64(ciphertext)
 * @param key - Optional 64-char hex key. Defaults to process.env.ENCRYPTION_KEY.
 * @returns The original plaintext string.
 */
export function decrypt(ciphertext: string, key?: string): string {
  const keyBuf = resolveKey(key)
  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error(
      `Invalid ciphertext format. Expected "base64(iv):base64(authTag):base64(ciphertext)", got ${parts.length} part(s).`
    )
  }

  const [ivB64, authTagB64, encryptedB64] = parts as [string, string, string]

  let iv: Buffer
  let authTag: Buffer
  let encrypted: Buffer
  try {
    iv = Buffer.from(ivB64, 'base64')
    authTag = Buffer.from(authTagB64, 'base64')
    encrypted = Buffer.from(encryptedB64, 'base64')
  } catch {
    throw new Error('Invalid ciphertext format: could not decode base64 components.')
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, keyBuf, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    throw new Error('Decryption failed. The key may be incorrect or the ciphertext may be corrupted.')
  }
}

/**
 * Generates a cryptographically random 32-byte key encoded as a 64-char hex string.
 *
 * Run once and store in ENCRYPTION_KEY env var.
 */
export function generateKey(): string {
  return randomBytes(32).toString('hex')
}
