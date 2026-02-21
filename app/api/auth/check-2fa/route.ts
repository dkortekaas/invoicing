import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { rateLimit, RATE_LIMITS, retryAfterInfo } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    // Use a separate key so wrong-password checks don't consume the
    // final-signIn budget (which uses "login:${ip}" in the NextAuth handler).
    const { allowed, resetAt } = await rateLimit(`check2fa:${ip}`, RATE_LIMITS.login)
    if (!allowed) {
      const { seconds, humanReadable } = retryAfterInfo(resetAt)
      return NextResponse.json(
        { error: `Te veel inlogpogingen. Probeer het over ${humanReadable} opnieuw.` },
        { status: 429, headers: { "Retry-After": String(seconds) } }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email en wachtwoord zijn verplicht" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      requires2FA: user.twoFactorEnabled,
    })
  } catch (_error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
