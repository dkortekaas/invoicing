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
  fiscalSettingsSchema,
  type FiscalSettingsFormData,
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

// ========== Newsletter Actions ==========
export async function getNewsletterStatus() {
  const userId = await getCurrentUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user) return { subscribed: false }

  const subscription = await db.newsletterSubscriber.findFirst({
    where: {
      OR: [
        { userId },
        { email: user.email.toLowerCase() },
      ],
    },
  })

  if (!subscription) return { subscribed: false }

  return {
    subscribed: subscription.status === "CONFIRMED",
    status: subscription.status,
  }
}

export async function toggleNewsletterSubscription() {
  const userId = await getCurrentUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user) throw new Error("User not found")

  const email = user.email.toLowerCase()

  const existing = await db.newsletterSubscriber.findFirst({
    where: {
      OR: [
        { userId },
        { email },
      ],
    },
  })

  if (existing) {
    if (existing.status === "CONFIRMED") {
      // Unsubscribe
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
          userId, // Link to user if not already
        },
      })
    } else {
      // Re-subscribe (skip confirmation for logged-in users)
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          unsubscribedAt: null,
          confirmToken: null,
          userId,
        },
      })
    }
  } else {
    // New subscription (skip confirmation for logged-in users)
    await db.newsletterSubscriber.create({
      data: {
        email,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        userId,
      },
    })
  }

  revalidatePath("/instellingen")
}

// ========== Company Info Actions ==========
export async function getCompanyInfo() {
  const userId = await getCurrentUserId()
  
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { company: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const c = user.company
  return {
    companyName: c?.name ?? "",
    companyEmail: c?.email ?? "",
    companyPhone: c?.phone ?? "",
    companyAddress: c?.address ?? "",
    companyCity: c?.city ?? "",
    companyPostalCode: c?.postalCode ?? "",
    companyCountry: c?.country ?? "Nederland",
    companyLogo: c?.logo ?? "",
  }
}

export async function updateCompanyInfo(data: CompanyInfoFormData) {
  const validated = companyInfoSchema.parse(data)
  const userId = await getCurrentUserId()

  const current = await db.user.findUnique({
    where: { id: userId },
    include: { company: true },
  })

  const payload = {
    name: validated.companyName,
    email: validated.companyEmail,
    phone: validated.companyPhone,
    address: validated.companyAddress,
    city: validated.companyCity,
    postalCode: validated.companyPostalCode,
    country: validated.companyCountry,
    logo: validated.companyLogo,
  }

  if (current?.company) {
    await db.company.update({
      where: { userId },
      data: payload,
    })
  } else {
    await db.company.create({
      data: { userId, ...payload },
    })
  }

  if (current?.company) {
    await logUpdate(
      "settings",
      userId,
      {
        companyName: current.company.name,
        companyEmail: current.company.email,
        companyPhone: current.company.phone,
        companyAddress: current.company.address,
        companyCity: current.company.city,
        companyPostalCode: current.company.postalCode,
        companyCountry: current.company.country,
        companyLogo: current.company.logo,
      },
      {
        companyName: payload.name,
        companyEmail: payload.email,
        companyPhone: payload.phone,
        companyAddress: payload.address,
        companyCity: payload.city,
        companyPostalCode: payload.postalCode,
        companyCountry: payload.country,
        companyLogo: payload.logo,
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
    include: { company: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const c = user.company
  return {
    companyName: c?.name ?? "",
    companyEmail: c?.email ?? "",
    companyPhone: c?.phone ?? "",
    companyAddress: c?.address ?? "",
    companyCity: c?.city ?? "",
    companyPostalCode: c?.postalCode ?? "",
    companyCountry: c?.country ?? "Nederland",
    vatNumber: user.vatNumber,
    kvkNumber: user.kvkNumber,
    iban: user.iban,
    invoicePrefix: user.invoicePrefix,
  }
}

export async function updateCompanySettings(data: CompanySettingsFormData) {
  const validated = companySettingsSchema.parse(data)
  const userId = await getCurrentUserId()

  const payload = {
    name: validated.companyName,
    email: validated.companyEmail,
    phone: validated.companyPhone,
    address: validated.companyAddress,
    city: validated.companyCity,
    postalCode: validated.companyPostalCode,
    country: validated.companyCountry,
  }

  const existing = await db.company.findUnique({ where: { userId } })
  if (existing) {
    await db.company.update({ where: { userId }, data: payload })
  } else {
    await db.company.create({ data: { userId, ...payload } })
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
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

// ========== Fiscal Settings Actions ==========
export async function getFiscalSettings(): Promise<FiscalSettingsFormData> {
  const userId = await getCurrentUserId()

  const settings = await db.fiscalSettings.findUnique({
    where: { userId },
  })

  if (!settings) {
    // Return defaults
    return {
      businessType: "EENMANSZAAK",
      useKOR: false,
      hoursTracked: false,
      manualHoursPerYear: null,
      isStarter: false,
      starterYearsUsed: 0,
      firstStarterYear: null,
      hasHomeOffice: false,
      homeOfficeType: null,
      homeOfficePercentage: null,
      hasBusinessCar: false,
      carPrivateUsage: null,
      useFOR: false,
    }
  }

  return {
    businessType: settings.businessType,
    useKOR: settings.useKOR,
    hoursTracked: settings.hoursTracked,
    manualHoursPerYear: settings.manualHoursPerYear,
    isStarter: settings.isStarter,
    starterYearsUsed: settings.starterYearsUsed,
    firstStarterYear: settings.firstStarterYear,
    hasHomeOffice: settings.hasHomeOffice,
    homeOfficeType: settings.homeOfficeType,
    homeOfficePercentage: settings.homeOfficePercentage?.toNumber() ?? null,
    hasBusinessCar: settings.hasBusinessCar,
    carPrivateUsage: settings.carPrivateUsage?.toNumber() ?? null,
    useFOR: settings.useFOR,
  }
}

export async function updateFiscalSettings(data: FiscalSettingsFormData) {
  const validated = fiscalSettingsSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current settings for audit logging
  const currentSettings = await db.fiscalSettings.findUnique({
    where: { userId },
  })

  const payload = {
    businessType: validated.businessType,
    useKOR: validated.useKOR,
    hoursTracked: validated.hoursTracked,
    manualHoursPerYear: validated.manualHoursPerYear,
    isStarter: validated.isStarter,
    starterYearsUsed: validated.starterYearsUsed,
    firstStarterYear: validated.firstStarterYear,
    hasHomeOffice: validated.hasHomeOffice,
    homeOfficeType: validated.homeOfficeType,
    homeOfficePercentage: validated.homeOfficePercentage,
    hasBusinessCar: validated.hasBusinessCar,
    carPrivateUsage: validated.carPrivateUsage,
    useFOR: validated.useFOR,
  }

  await db.fiscalSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...payload,
    },
    update: payload,
  })

  // Log audit trail
  if (currentSettings) {
    await logUpdate(
      "settings",
      userId,
      {
        businessType: currentSettings.businessType,
        useKOR: currentSettings.useKOR,
        hoursTracked: currentSettings.hoursTracked,
        isStarter: currentSettings.isStarter,
        hasHomeOffice: currentSettings.hasHomeOffice,
        hasBusinessCar: currentSettings.hasBusinessCar,
        useFOR: currentSettings.useFOR,
      },
      {
        businessType: validated.businessType,
        useKOR: validated.useKOR,
        hoursTracked: validated.hoursTracked,
        isStarter: validated.isStarter,
        hasHomeOffice: validated.hasHomeOffice,
        hasBusinessCar: validated.hasBusinessCar,
        useFOR: validated.useFOR,
      },
      userId
    )
  }

  revalidatePath("/instellingen")
}