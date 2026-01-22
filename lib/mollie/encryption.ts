import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.MOLLIE_ENCRYPTION_KEY
  if (!key) {
    throw new Error("MOLLIE_ENCRYPTION_KEY is not configured")
  }

  // Key should be 32 bytes (64 hex characters) for AES-256
  if (key.length !== 64) {
    throw new Error("MOLLIE_ENCRYPTION_KEY must be 64 hex characters (32 bytes)")
  }

  return Buffer.from(key, "hex")
}

/**
 * Encrypt a Mollie API key using AES-256-GCM
 * Returns a string in format: iv:authTag:encryptedData (all base64)
 */
export function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(apiKey, "utf8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encryptedData
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted,
  ].join(":")
}

/**
 * Decrypt an encrypted Mollie API key
 */
export function decryptApiKey(encryptedData: string): string {
  const key = getEncryptionKey()

  const parts = encryptedData.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format")
  }

  const [ivBase64, authTagBase64, encrypted] = parts
  const iv = Buffer.from(ivBase64, "base64")
  const authTag = Buffer.from(authTagBase64, "base64")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Check if a string looks like an encrypted API key
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":")
  return parts.length === 3 && parts.every(part => {
    try {
      Buffer.from(part, "base64")
      return true
    } catch {
      return false
    }
  })
}

/**
 * Validate a Mollie API key format
 * Test keys start with 'test_', live keys start with 'live_'
 */
export function validateMollieApiKey(apiKey: string): { valid: boolean; isTestKey: boolean; error?: string } {
  if (!apiKey) {
    return { valid: false, isTestKey: false, error: "API key is required" }
  }

  const trimmed = apiKey.trim()

  if (trimmed.startsWith("test_")) {
    return { valid: true, isTestKey: true }
  }

  if (trimmed.startsWith("live_")) {
    return { valid: true, isTestKey: false }
  }

  return {
    valid: false,
    isTestKey: false,
    error: "API key must start with 'test_' or 'live_'"
  }
}
