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
} from "@/lib/validations"
import { getCurrentUserId } from "@/lib/server-utils"
import { hashPassword } from "@/lib/auth-utils"

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

  await db.user.update({
    where: { id: userId },
    data: {
      name: validated.name,
      email: validated.email,
    },
  })

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

  await db.user.update({
    where: { id: userId },
    data: {
      vatNumber: validated.vatNumber,
      kvkNumber: validated.kvkNumber,
      iban: validated.iban,
      invoicePrefix: validated.invoicePrefix,
    },
  })

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

  revalidatePath("/instellingen")
}
