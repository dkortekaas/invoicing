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

  // Create user; bedrijfsgegevens komen in aparte Company-tabel (via Instellingen > Bedrijfsgegevens)
  const user = await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      invoicePrefix: "FAC",
      role: "ADMIN",
    },
  })

  return user
}
