import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return redirectWithMessage("error", "Ongeldige bevestigingslink.")
  }

  try {
    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { confirmToken: token },
    })

    if (!subscriber) {
      return redirectWithMessage(
        "error",
        "Deze bevestigingslink is ongeldig of al gebruikt."
      )
    }

    if (subscriber.status === "CONFIRMED") {
      return redirectWithMessage("info", "Je inschrijving is al bevestigd.")
    }

    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "CONFIRMED",
        confirmToken: null, // Invalidate token
        confirmedAt: new Date(),
        unsubscribedAt: null,
      },
    })

    return redirectWithMessage(
      "success",
      "Je inschrijving voor de nieuwsbrief is bevestigd!"
    )
  } catch (error) {
    console.error("Newsletter confirm error:", error)
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
