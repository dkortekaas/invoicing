"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import {
  companySettingsSchema,
  type CompanySettingsFormData,
  profileSchema,
  type ProfileFormData,
  companyInfoSchema,
  type CompanyInfoFormData,
  financialInfoSchema,
  type FinancialInfoFormData,
  changePasswordSchema,
  type ChangePasswordFormData,
  mollieSettingsSchema,
  type MollieSettingsFormData,
} from "@/lib/validations"
import { encryptApiKey, validateMollieApiKey } from "@/lib/mollie/encryption"
import { MollieClient } from "@/lib/mollie/client"
import { getCurrentUserId } from "@/lib/server-utils"
import { hashPassword } from "@/lib/auth-utils"
import { logUpdate, logPasswordChange } from "@/lib/audit/helpers"

// ========== Profile Actions ==========
export async function getProfile() {
  const userId = await getCurrentUserId()
  
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    name: user.name,
    email: user.email,
  }
}

export async function updateProfile(data: ProfileFormData) {
  const validated = profileSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current profile for audit logging
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })

  await db.user.update({
    where: { id: userId },
    data: {
      name: validated.name,
      email: validated.email,
    },
  })

  // Log audit trail
  if (currentUser) {
    await logUpdate(
      "user",
      userId,
      {
        name: currentUser.name,
        email: currentUser.email,
      },
      {
        name: validated.name,
        email: validated.email,
      },
      userId
    )
  }

  revalidatePath("/instellingen")
}

// ========== Company Info Actions ==========
export async function getCompanyInfo() {
  const userId = await getCurrentUserId()
  
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    companyName: user.companyName,
    companyEmail: user.companyEmail,
    companyPhone: user.companyPhone,
    companyAddress: user.companyAddress,
    companyCity: user.companyCity,
    companyPostalCode: user.companyPostalCode,
    companyCountry: user.companyCountry,
    companyLogo: user.companyLogo,
  }
}

export async function updateCompanyInfo(data: CompanyInfoFormData) {
  const validated = companyInfoSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current company info for audit logging
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      companyAddress: true,
      companyCity: true,
      companyPostalCode: true,
      companyCountry: true,
      companyLogo: true,
    },
  })

  await db.user.update({
    where: { id: userId },
    data: {
      companyName: validated.companyName,
      companyEmail: validated.companyEmail,
      companyPhone: validated.companyPhone,
      companyAddress: validated.companyAddress,
      companyCity: validated.companyCity,
      companyPostalCode: validated.companyPostalCode,
      companyCountry: validated.companyCountry,
      companyLogo: validated.companyLogo,
    },
  })

  // Log audit trail
  if (currentUser) {
    await logUpdate(
      "settings",
      userId,
      {
        companyName: currentUser.companyName,
        companyEmail: currentUser.companyEmail,
        companyPhone: currentUser.companyPhone,
        companyAddress: currentUser.companyAddress,
        companyCity: currentUser.companyCity,
        companyPostalCode: currentUser.companyPostalCode,
        companyCountry: currentUser.companyCountry,
        companyLogo: currentUser.companyLogo,
      },
      {
        companyName: validated.companyName,
        companyEmail: validated.companyEmail,
        companyPhone: validated.companyPhone,
        companyAddress: validated.companyAddress,
        companyCity: validated.companyCity,
        companyPostalCode: validated.companyPostalCode,
        companyCountry: validated.companyCountry,
        companyLogo: validated.companyLogo,
      },
      userId
    )
  }

  revalidatePath("/instellingen")
}

// ========== Financial Info Actions ==========
export async function getFinancialInfo() {
  const userId = await getCurrentUserId()
  
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    vatNumber: user.vatNumber,
    kvkNumber: user.kvkNumber,
    iban: user.iban,
    invoicePrefix: user.invoicePrefix,
  }
}

export async function updateFinancialInfo(data: FinancialInfoFormData) {
  const validated = financialInfoSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current financial info for audit logging
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      vatNumber: true,
      kvkNumber: true,
      iban: true,
      invoicePrefix: true,
    },
  })

  await db.user.update({
    where: { id: userId },
    data: {
      vatNumber: validated.vatNumber,
      kvkNumber: validated.kvkNumber,
      iban: validated.iban,
      invoicePrefix: validated.invoicePrefix,
    },
  })

  // Log audit trail
  if (currentUser) {
    await logUpdate(
      "settings",
      userId,
      {
        vatNumber: currentUser.vatNumber,
        kvkNumber: currentUser.kvkNumber,
        iban: currentUser.iban,
        invoicePrefix: currentUser.invoicePrefix,
      },
      {
        vatNumber: validated.vatNumber,
        kvkNumber: validated.kvkNumber,
        iban: validated.iban,
        invoicePrefix: validated.invoicePrefix,
      },
      userId
    )
  }

  revalidatePath("/instellingen")
}

// ========== Legacy Actions (kept for backwards compatibility) ==========
export async function getCompanySettings() {
  const userId = await getCurrentUserId()
  
  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    companyName: user.companyName,
    companyEmail: user.companyEmail,
    companyPhone: user.companyPhone,
    companyAddress: user.companyAddress,
    companyCity: user.companyCity,
    companyPostalCode: user.companyPostalCode,
    companyCountry: user.companyCountry,
    vatNumber: user.vatNumber,
    kvkNumber: user.kvkNumber,
    iban: user.iban,
    invoicePrefix: user.invoicePrefix,
  }
}

export async function updateCompanySettings(data: CompanySettingsFormData) {
  const validated = companySettingsSchema.parse(data)
  const userId = await getCurrentUserId()

  const user = await db.user.update({
    where: { id: userId },
    data: {
      companyName: validated.companyName,
      companyEmail: validated.companyEmail,
      companyPhone: validated.companyPhone,
      companyAddress: validated.companyAddress,
      companyCity: validated.companyCity,
      companyPostalCode: validated.companyPostalCode,
      companyCountry: validated.companyCountry,
      vatNumber: validated.vatNumber,
      kvkNumber: validated.kvkNumber,
      iban: validated.iban,
      invoicePrefix: validated.invoicePrefix,
    },
  })

  revalidatePath("/instellingen")
  return user
}

// ========== Change Password Actions ==========
export async function changePassword(data: ChangePasswordFormData) {
  const validated = changePasswordSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current user with password hash
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  })

  if (!user) {
    throw new Error("Gebruiker niet gevonden")
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(
    validated.currentPassword,
    user.passwordHash
  )

  if (!isValidPassword) {
    throw new Error("Huidig wachtwoord is onjuist")
  }

  // Hash new password
  const newPasswordHash = await hashPassword(validated.newPassword)

  // Update password
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  })

  // Log password change
  await logPasswordChange(userId)

  revalidatePath("/instellingen")
}

// ========== Email Settings Actions ==========
export async function getEmailSettings() {
  const userId = await getCurrentUserId()
  
  let settings = await db.emailSettings.findUnique({
    where: { userId },
  })

  // Create default settings if they don't exist
  if (!settings) {
    settings = await db.emailSettings.create({
      data: {
        userId,
        autoSendInvoice: false,
        autoSendReminders: false,
        autoSendPaymentConfirm: true,
        friendlyReminderDays: -3,
        firstReminderDays: 7,
        secondReminderDays: 14,
        finalReminderDays: 30,
      },
    })
  }

  return {
    autoSendInvoice: settings.autoSendInvoice,
    autoSendReminders: settings.autoSendReminders,
    autoSendPaymentConfirm: settings.autoSendPaymentConfirm,
    friendlyReminderDays: settings.friendlyReminderDays,
    firstReminderDays: settings.firstReminderDays,
    secondReminderDays: settings.secondReminderDays,
    finalReminderDays: settings.finalReminderDays,
    emailSignature: settings.emailSignature,
    invoiceEmailCc: settings.invoiceEmailCc,
  }
}

export async function updateEmailSettings(data: {
  autoSendInvoice: boolean
  autoSendReminders: boolean
  autoSendPaymentConfirm: boolean
  friendlyReminderDays: number
  firstReminderDays: number
  secondReminderDays: number
  finalReminderDays: number
  emailSignature?: string
  invoiceEmailCc?: string
}) {
  const userId = await getCurrentUserId()

  await db.emailSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  })

  revalidatePath("/instellingen")
}

// ========== Mollie Settings Actions ==========
export async function getMollieSettings() {
  const userId = await getCurrentUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      mollieApiKey: true,
      mollieEnabled: true,
      mollieTestMode: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    mollieEnabled: user.mollieEnabled,
    mollieTestMode: user.mollieTestMode,
    hasApiKey: !!user.mollieApiKey,
  }
}

export async function updateMollieSettings(data: MollieSettingsFormData) {
  const validated = mollieSettingsSchema.parse(data)
  const userId = await getCurrentUserId()

  // Validate API key format
  const keyValidation = validateMollieApiKey(validated.mollieApiKey)
  if (!keyValidation.valid) {
    throw new Error(keyValidation.error || "Ongeldige API key")
  }

  // Encrypt the API key
  const encryptedApiKey = encryptApiKey(validated.mollieApiKey)

  // Get current settings for audit logging
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      mollieEnabled: true,
      mollieTestMode: true,
      mollieApiKey: true,
    },
  })

  await db.user.update({
    where: { id: userId },
    data: {
      mollieApiKey: encryptedApiKey,
      mollieEnabled: validated.mollieEnabled,
      mollieTestMode: keyValidation.isTestKey,
    },
  })

  // Log audit trail (don't log actual API key values)
  if (currentUser) {
    await logUpdate(
      "settings",
      userId,
      {
        mollieEnabled: currentUser.mollieEnabled,
        mollieTestMode: currentUser.mollieTestMode,
        mollieApiKeyConfigured: !!currentUser.mollieApiKey,
      },
      {
        mollieEnabled: validated.mollieEnabled,
        mollieTestMode: keyValidation.isTestKey,
        mollieApiKeyConfigured: true,
      },
      userId
    )
  }

  revalidatePath("/instellingen")
}

export async function testMollieConnection(): Promise<{
  success: boolean
  mode?: "test" | "live"
  error?: string
}> {
  const userId = await getCurrentUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      mollieApiKey: true,
      mollieTestMode: true,
    },
  })

  if (!user || !user.mollieApiKey) {
    return { success: false, error: "Geen API key geconfigureerd" }
  }

  try {
    const { decryptApiKey } = await import("@/lib/mollie/encryption")
    const apiKey = decryptApiKey(user.mollieApiKey)

    const client = new MollieClient({
      apiKey,
      testMode: user.mollieTestMode,
    })

    const result = await client.testConnection()
    return result
  } catch (error) {
    console.error("Mollie connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verbinding mislukt",
    }
  }
}