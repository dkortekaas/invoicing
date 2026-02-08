import crypto from "crypto"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { newsletterSubscribeSchema } from "@/lib/validations"
import { resend, EMAIL_CONFIG } from "@/lib/email/client"
import NewsletterConfirmEmail from "@/emails/newsletter-confirm-email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = newsletterSubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ongeldig e-mailadres." },
        { status: 400 }
      )
    }

    const email = parsed.data.email.toLowerCase().trim()

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing) {
      if (existing.status === "CONFIRMED") {
        // Already confirmed - don't reveal this, just return success
        return NextResponse.json({
          message:
            "Als dit e-mailadres nog niet is ingeschreven, ontvang je een bevestigingsmail.",
        })
      }

      if (existing.status === "UNSUBSCRIBED") {
        // Re-subscribe: generate new token and set to PENDING
        const confirmToken = crypto.randomBytes(32).toString("hex")

        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            confirmToken,
            unsubscribedAt: null,
          },
        })

        await sendConfirmationEmail(email, confirmToken)

        return NextResponse.json({
          message:
            "Als dit e-mailadres nog niet is ingeschreven, ontvang je een bevestigingsmail.",
        })
      }

      // PENDING - resend confirmation
      const confirmToken = crypto.randomBytes(32).toString("hex")

      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { confirmToken },
      })

      await sendConfirmationEmail(email, confirmToken)

      return NextResponse.json({
        message:
          "Als dit e-mailadres nog niet is ingeschreven, ontvang je een bevestigingsmail.",
      })
    }

    // New subscriber
    const confirmToken = crypto.randomBytes(32).toString("hex")

    await db.newsletterSubscriber.create({
      data: {
        email,
        confirmToken,
        status: "PENDING",
      },
    })

    await sendConfirmationEmail(email, confirmToken)

    return NextResponse.json({
      message:
        "Als dit e-mailadres nog niet is ingeschreven, ontvang je een bevestigingsmail.",
    })
  } catch (error) {
    console.error("Newsletter subscribe error:", error)
    return NextResponse.json(
      { error: "Er is een fout opgetreden. Probeer het later opnieuw." },
      { status: 500 }
    )
  }
}

async function sendConfirmationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const confirmUrl = `${appUrl}/api/newsletter/confirm?token=${token}`

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: email,
    subject: "Bevestig je nieuwsbrief inschrijving - Declair",
    react: NewsletterConfirmEmail({ confirmUrl }),
  })
}
