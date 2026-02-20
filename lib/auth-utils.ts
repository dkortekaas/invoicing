import crypto from "crypto"
import bcrypt from "bcryptjs"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import { db } from "./db"

/**
 * Hash een wachtwoord
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verifieer een wachtwoord
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Genereer een TOTP secret voor 2FA
 */
export function generateTwoFactorSecret(email: string, companyName: string) {
  return speakeasy.generateSecret({
    name: `${companyName} (${email})`,
    issuer: "Declair",
  })
}

/**
 * Bouw otpauth URL voor QR code met het opgeslagen base32 secret.
 * Zo komt de QR exact overeen met wat we bij login verifiëren.
 */
export function buildOtpauthUrl(base32Secret: string, label: string): string {
  return speakeasy.otpauthURL({
    secret: base32Secret,
    encoding: "base32",
    label: encodeURIComponent(label),
    issuer: "Declair",
  })
}

/**
 * Alleen base32-karakters behouden en uppercase (voorkomt problemen met DB/encoding)
 */
export function sanitizeBase32Secret(secret: string): string {
  return String(secret ?? "")
    .replace(/[^A-Za-z2-7]/g, "")
    .toUpperCase()
}

/**
 * Normaliseer een TOTP of backup code (trim, verwijder spaties)
 */
function normalizeCode(code: string): string {
  return String(code ?? "").trim().replace(/\s/g, "")
}

/**
 * Verifieer een TOTP code
 */
export function verifyTwoFactorCode(
  secret: string,
  token: string
): boolean {
  const sanitized = sanitizeBase32Secret(secret)
  if (!sanitized) return false
  let normalizedToken = normalizeCode(token)
  if (!normalizedToken || !/^\d+$/.test(normalizedToken)) {
    return false
  }
  // Pad met leading zero naar 6 cijfers (authenticator toont soms "012345")
  if (normalizedToken.length < 6) {
    normalizedToken = normalizedToken.padStart(6, "0")
  } else if (normalizedToken.length > 6) {
    return false
  }
  return speakeasy.totp.verify({
    secret: sanitized,
    encoding: "base32",
    token: normalizedToken,
    window: 10, // ±5 min voor klokverschil
  })
}

/**
 * Genereer QR code data URL voor authenticator app
 */
export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl)
}

/**
 * Hash a backup code using SHA-256 for secure storage.
 */
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

/**
 * Genereer backup codes voor 2FA.
 * Returns plain codes (to show user once) and hashed codes (to store in DB).
 * Uses crypto.randomBytes instead of Math.random for secure generation.
 */
export function generateBackupCodes(count: number = 10): {
  plainCodes: string[]
  hashedCodes: string[]
} {
  const plainCodes: string[] = []
  const hashedCodes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomInt(10000000, 99999999).toString()
    plainCodes.push(code)
    hashedCodes.push(hashBackupCode(code))
  }
  return { plainCodes, hashedCodes }
}

/**
 * Normaliseer backup code (trim, verwijder spaties en koppeltekens)
 */
function normalizeBackupCode(code: string): string {
  return String(code ?? "").trim().replace(/[\s-]/g, "")
}

/**
 * Sla gehashte backup codes op in de BackupCode-tabel.
 * Verwijdert eerst alle bestaande (ongebruikte én gebruikte) codes voor deze user,
 * zodat regeneratie altijd een schone set oplevert.
 */
export async function storeBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
  await db.backupCode.deleteMany({ where: { userId } })
  if (hashedCodes.length > 0) {
    await db.backupCode.createMany({
      data: hashedCodes.map((codeHash) => ({ userId, codeHash })),
    })
  }
}

/**
 * Verifieer een backup code tegen de BackupCode-tabel.
 * Markeert een gevonden code als gebruikt (usedAt) zodat hij niet opnieuw kan worden ingediend.
 * Ondersteunt ook legacy plain-text codes die tijdens de JSON-migratie zijn overgezet.
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const normalizedInput = normalizeBackupCode(code)
  if (!normalizedInput || normalizedInput.length !== 8 || !/^\d{8}$/.test(normalizedInput)) {
    return false
  }

  const hashedInput = hashBackupCode(normalizedInput)

  // Check hashed code first
  let backupCode = await db.backupCode.findFirst({
    where: { userId, codeHash: hashedInput, usedAt: null },
  })

  // Legacy: migrated codes that were stored as plain text before hashing was introduced
  if (!backupCode) {
    backupCode = await db.backupCode.findFirst({
      where: { userId, codeHash: normalizedInput, usedAt: null },
    })
  }

  if (!backupCode) {
    return false
  }

  // Mark as used — kept in the table for audit trail
  await db.backupCode.update({
    where: { id: backupCode.id },
    data: { usedAt: new Date() },
  })

  return true
}
