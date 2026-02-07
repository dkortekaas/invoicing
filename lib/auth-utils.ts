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
 * Genereer backup codes voor 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-digit code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    codes.push(code)
  }
  return codes
}

/**
 * Normaliseer backup code (trim, verwijder spaties en koppeltekens)
 */
function normalizeBackupCode(code: string): string {
  return String(code ?? "").trim().replace(/[\s-]/g, "")
}

/**
 * Verifieer een backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  })

  if (!user || !user.backupCodes) {
    return false
  }

  const normalizedInput = normalizeBackupCode(code)
  if (!normalizedInput || normalizedInput.length !== 8 || !/^\d{8}$/.test(normalizedInput)) {
    return false
  }

  let codes: string[]
  try {
    const parsed = JSON.parse(user.backupCodes) as unknown
    codes = Array.isArray(parsed)
      ? (parsed as unknown[]).map((c) => String(c).trim()).filter(Boolean)
      : []
  } catch {
    return false
  }

  const index = codes.findIndex((c) => c === normalizedInput)
  if (index === -1) {
    return false
  }

  // Remove used backup code
  codes.splice(index, 1)
  await db.user.update({
    where: { id: userId },
    data: { backupCodes: JSON.stringify(codes) },
  })

  return true
}
