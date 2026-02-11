import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * Generate a deterministic HMAC-based unsubscribe token for a subscriber.
 * This allows verifying unsubscribe links without storing a separate token.
 */
function generateUnsubscribeToken(subscriberId: string, email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || ""
  return crypto
    .createHmac("sha256", secret)
    .update(`unsubscribe:${subscriberId}:${email}`)
    .digest("hex")
}

export { generateUnsubscribeToken }

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")
  const token = request.nextUrl.searchParams.get("token")

  if (!email || !token) {
    return redirectWithMessage("error", "Ongeldige uitschrijflink.")
  }

  try {
    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!subscriber) {
      return redirectWithMessage("error", "Ongeldige uitschrijflink.")
    }

    // Verify HMAC token to prevent unauthorized unsubscribes
    const expectedToken = generateUnsubscribeToken(subscriber.id, subscriber.email)
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
      return redirectWithMessage("error", "Ongeldige uitschrijflink.")
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return redirectWithMessage("info", "Je bent al uitgeschreven.")
    }

    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    })

    return redirectWithMessage(
      "success",
      "Je bent uitgeschreven van de nieuwsbrief."
    )
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error)
    return redirectWithMessage(
      "error",
      "Er is een fout opgetreden. Probeer het later opnieuw."
    )
  }
}

function redirectWithMessage(type: string, message: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const url = new URL("/nieuwsbrief", appUrl)
  url.searchParams.set("type", type)
  url.searchParams.set("message", message)
  return NextResponse.redirect(url)
}
