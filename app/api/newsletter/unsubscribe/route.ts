import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

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

    if (!subscriber || subscriber.id !== token) {
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
