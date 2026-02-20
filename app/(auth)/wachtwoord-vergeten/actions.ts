"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { forgotPasswordSchema } from "@/lib/validations"
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function requestPasswordReset(formData: { email: string }) {
  const parsed = forgotPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: "Ongeldig e-mailadres." }
  }

  const { email } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  // Rate limit password reset requests per email
  const { allowed } = await rateLimit(`password-reset:${normalizedEmail}`, RATE_LIMITS.passwordReset)
  if (!allowed) {
    // Return the same success message to prevent email enumeration
    return {
      success: true,
      message:
        "Als er een account bestaat met dit e-mailadres, ontvang je binnen enkele minuten een e-mail met instructies om je wachtwoord te herstellen.",
    }
  }

  try {
    // Check if user exists (but don't reveal this to the client)
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (user) {
      // Delete any existing tokens for this email
      await db.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      })

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex")
      const tokenHash = hashToken(token)

      // Store hashed token in database
      await db.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          tokenHash,
          expires: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
        },
      })

      // Build reset URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const resetUrl = `${appUrl}/wachtwoord-resetten?token=${token}`

      // Send email
      await sendPasswordResetEmail({
        email: normalizedEmail,
        resetUrl,
      })
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message:
        "Als er een account bestaat met dit e-mailadres, ontvang je binnen enkele minuten een e-mail met instructies om je wachtwoord te herstellen.",
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return {
      error: "Er is een fout opgetreden. Probeer het later opnieuw.",
    }
  }
}
