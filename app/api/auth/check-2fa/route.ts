import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { rateLimit, RATE_LIMITS, retryAfterInfo } from "@/lib/rate-limit"
import {
  verifyTwoFactorCode,
  generatePreAuthCookie,
} from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP — separate key from the NextAuth callback budget.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { allowed, resetAt } = await rateLimit(`check2fa:${ip}`, RATE_LIMITS.login)
    if (!allowed) {
      const { seconds, humanReadable } = retryAfterInfo(resetAt)
      return NextResponse.json(
        { error: `Te veel inlogpogingen. Probeer het over ${humanReadable} opnieuw.` },
        { status: 429, headers: { "Retry-After": String(seconds) } }
      )
    }

    const body = await request.json()
    const { email, password, twoFactorCode } = body as {
      email?: string
      password?: string
      twoFactorCode?: string
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email en wachtwoord zijn verplicht" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
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

    // ── Step 1: no 2FA code provided — just report whether 2FA is required ──
    if (!twoFactorCode) {
      return NextResponse.json({ requires2FA: user.twoFactorEnabled })
    }

    // ── Step 2: 2FA code provided — verify it and return a pre-auth cookie ──
    if (!user.twoFactorEnabled) {
      // 2FA not enabled; no verification needed
      return NextResponse.json({ preAuthVerified: true })
    }

    const isValidCode = verifyTwoFactorCode(user.twoFactorSecret ?? "", twoFactorCode)
    if (!isValidCode) {
      return NextResponse.json(
        { error: "Ongeldige 2FA code. Probeer het opnieuw." },
        { status: 401 }
      )
    }

    // Code is correct — generate a short-lived signed cookie so authorize()
    // can confirm the 2FA check was done without relying on NextAuth credential passing.
    const cookieValue = generatePreAuthCookie(user.id)
    const response = NextResponse.json({ preAuthVerified: true })
    response.headers.set(
      "Set-Cookie",
      `2fa_preauth=${encodeURIComponent(cookieValue)}; HttpOnly; SameSite=Strict; Max-Age=120; Path=/`
    )
    return response
  } catch (_error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
