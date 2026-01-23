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
 * Verifieer een TOTP code
 */
export function verifyTwoFactorCode(
  secret: string,
  token: string
): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps before/after
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

  const codes = JSON.parse(user.backupCodes) as string[]
  const index = codes.indexOf(code)

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
