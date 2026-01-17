"use server"

import { db } from "@/lib/db"
import { registerSchema, type RegisterFormData } from "@/lib/validations"
import { hashPassword } from "@/lib/auth-utils"

export async function registerUser(data: RegisterFormData) {
  const validated = registerSchema.parse(data)

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: validated.email },
  })

  if (existingUser) {
    throw new Error("Dit e-mailadres is al geregistreerd")
  }

  // Hash password
  const passwordHash = await hashPassword(validated.password)

  // Create user
  const user = await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      companyName: validated.companyName,
      companyEmail: validated.companyEmail,
      companyAddress: validated.companyAddress,
      companyCity: validated.companyCity,
      companyPostalCode: validated.companyPostalCode,
      companyCountry: "Nederland",
      invoicePrefix: "FAC",
    },
  })

  return user
}
