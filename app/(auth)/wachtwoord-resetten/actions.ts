"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { resetPasswordSchema } from "@/lib/validations"
import { hashPassword } from "@/lib/auth-utils"
import { logPasswordChange } from "@/lib/audit/helpers"

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function resetPassword(formData: {
  token: string
  password: string
  confirmPassword: string
}) {
  const parsed = resetPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message
    return { error: firstError || "Ongeldige invoer." }
  }

  const { token, password } = parsed.data

  try {
    // Hash the incoming token to compare with stored hash
    const tokenHash = hashToken(token)

    // Find the token in the database
    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
    })

    if (!resetToken) {
      return {
        error:
          "Deze herstel-link is ongeldig of al gebruikt. Vraag een nieuwe link aan.",
      }
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      // Clean up expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      })

      return {
        error:
          "Deze herstel-link is verlopen. Vraag een nieuwe link aan.",
      }
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true },
    })

    if (!user) {
      // Clean up token if user no longer exists
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      })

      return {
        error: "Er is een fout opgetreden. Probeer het opnieuw.",
      }
    }

    // Hash the new password and update user
    const passwordHash = await hashPassword(password)

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Delete all password reset tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: resetToken.email },
    })

    // Audit log
    await logPasswordChange(user.id)

    return {
      success: true,
      message:
        "Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.",
    }
  } catch (error) {
    console.error("Password reset error:", error)
    return {
      error: "Er is een fout opgetreden. Probeer het later opnieuw.",
    }
  }
}
