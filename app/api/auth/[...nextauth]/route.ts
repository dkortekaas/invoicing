import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, RATE_LIMITS, retryAfterInfo } from "@/lib/rate-limit"

export const GET = handlers.GET

export async function POST(request: NextRequest) {
  const url = new URL(request.url)

  // Apply rate limiting on the credentials callback endpoint so brute-force
  // attacks cannot bypass the /api/auth/check-2fa rate limit by POSTing
  // directly to NextAuth's own callback URL.
  if (url.pathname.endsWith("/callback/credentials")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const { allowed, resetAt } = await rateLimit(`login:${ip}`, RATE_LIMITS.login)

    if (!allowed) {
      const { seconds, humanReadable } = retryAfterInfo(resetAt)
      return NextResponse.json(
        { error: `Te veel inlogpogingen. Probeer het over ${humanReadable} opnieuw.` },
        { status: 429, headers: { "Retry-After": String(seconds) } }
      )
    }
  }

  return handlers.POST(request)
}
