"use server"

import { getUserId } from "@/lib/get-session"
import { db } from "@/lib/db"
import {
  generateTwoFactorSecret,
  verifyTwoFactorCode,
  generateQRCodeDataURL,
  generateBackupCodes,
  buildOtpauthUrl,
} from "@/lib/auth-utils"

export async function generate2FASecret() {
  const userId = await getUserId()
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, company: { select: { name: true } } },
  })

  if (!user) {
    throw new Error("Gebruiker niet gevonden")
  }

  const secret = generateTwoFactorSecret(user.email, user.company?.name ?? user.email)
  const label = `${user.company?.name ?? user.email} (${user.email})`
  // QR bouwen met exact het base32 secret dat we opslaan (geen interne conversie)
  const otpauthUrl = buildOtpauthUrl(secret.base32!, label)
  const qrCode = await generateQRCodeDataURL(otpauthUrl)

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

  // Verify code (normaliseer: trim en verwijder spaties)
  const normalizedCode = String(code ?? "").trim().replace(/\s/g, "")
  const isValid = verifyTwoFactorCode(user.twoFactorSecret, normalizedCode)

  if (!isValid) {
    throw new Error("Ongeldige verificatie code")
  }

  // Generate backup codes (plain to show user, hashed to store)
  const { plainCodes, hashedCodes } = generateBackupCodes(10)

  // Enable 2FA - store only hashed codes in DB
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      backupCodes: JSON.stringify(hashedCodes),
    },
  })

  // Return plain codes to show user (only time they'll see them)
  return { backupCodes: plainCodes }
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
