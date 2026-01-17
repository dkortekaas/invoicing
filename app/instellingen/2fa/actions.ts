"use server"

import { getUserId } from "@/lib/get-session"
import { db } from "@/lib/db"
import {
  generateTwoFactorSecret,
  verifyTwoFactorCode,
  generateQRCodeDataURL,
  generateBackupCodes,
} from "@/lib/auth-utils"

export async function generate2FASecret() {
  const userId = await getUserId()
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, companyName: true },
  })

  if (!user) {
    throw new Error("Gebruiker niet gevonden")
  }

  const secret = generateTwoFactorSecret(user.email, user.companyName)
  const qrCode = await generateQRCodeDataURL(secret.otpauth_url!)

  // Save secret temporarily (not enabled yet)
  await db.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 },
  })

  return {
    secret: secret.base32!,
    qrCode,
  }
}

export async function verify2FASetup(code: string) {
  const userId = await getUserId()
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  })

  if (!user || !user.twoFactorSecret) {
    throw new Error("Geen 2FA secret gevonden. Start de setup opnieuw.")
  }

  // Verify code
  const isValid = verifyTwoFactorCode(user.twoFactorSecret, code)

  if (!isValid) {
    throw new Error("Ongeldige verificatie code")
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes(10)

  // Enable 2FA
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      backupCodes: JSON.stringify(backupCodes),
    },
  })

  return { backupCodes }
}

export async function disable2FA() {
  const userId = await getUserId()

  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  })
}
