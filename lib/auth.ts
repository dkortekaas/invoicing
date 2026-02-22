import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"
import { verifyBackupCode, verifyTwoFactorCode, verifyPreAuthCookie } from "./auth-utils"
import { logLogin, logLoginFailed } from "./audit/helpers"
import { captureException } from "./error-monitoring"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", optional: true },
      },
      // NextAuth v5 passes the raw Request as the second argument.
      async authorize(credentials, request) {
        const dev = process.env.NODE_ENV === "development"
        try {
          if (!credentials?.email || !credentials?.password) {
            if (dev) console.log("[auth] authorize: missing email or password")
            return null
          }

          const email = credentials.email as string
          const password = credentials.password as string

          // Explicit select to avoid querying columns that may not exist yet
          // (e.g. sessionVersion before the migration is applied).
          const user = await db.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              twoFactorEnabled: true,
              twoFactorSecret: true,
            },
          })

          if (!user) {
            await logLoginFailed(email, "User not found")
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.passwordHash)

          if (!isValidPassword) {
            if (dev) console.log("[auth] authorize: invalid password for", email)
            await logLoginFailed(email, "Invalid password")
            return null
          }

          // If 2FA is enabled, the login page first POSTs to /api/auth/check-2fa
          // which verifies the TOTP code and sets a short-lived signed cookie
          // (2fa_preauth).  We read that cookie here to confirm the check was done.
          // This avoids relying on NextAuth's credential-passing for the code itself.
          if (user.twoFactorEnabled) {
            // ── Primary path: pre-auth cookie set by check-2fa ────────────────
            const cookieHeader = (request as Request | undefined)?.headers?.get?.("cookie") ?? ""
            const match = cookieHeader.match(/(?:^|;\s*)2fa_preauth=([^;]+)/)
            const preAuthValue = match ? decodeURIComponent(match[1]!) : null

            if (dev) console.log("[auth] authorize: 2FA required, preAuthCookie present:", !!preAuthValue)

            if (preAuthValue && verifyPreAuthCookie(preAuthValue, user.id)) {
              // Cookie verifies — 2FA already confirmed by check-2fa
              if (dev) console.log("[auth] authorize: pre-auth cookie valid, allowing login")
            } else {
              // ── Fallback path: twoFactorCode credential (kept for compatibility) ─
              const rawCode = credentials.twoFactorCode as string | undefined
              const twoFactorCode =
                typeof rawCode === "string" ? rawCode.trim().replace(/\s/g, "") : ""

              if (dev) console.log("[auth] authorize: fallback TOTP, code length:", twoFactorCode.length, "secret present:", !!user.twoFactorSecret)

              if (!twoFactorCode) {
                return null
              }

              let isValid = verifyTwoFactorCode(user.twoFactorSecret ?? "", twoFactorCode)
              if (dev) console.log("[auth] authorize: TOTP valid:", isValid)

              if (!isValid) {
                try {
                  isValid = await verifyBackupCode(user.id, twoFactorCode)
                  if (dev) console.log("[auth] authorize: backup code valid:", isValid)
                } catch (backupErr) {
                  console.error("[auth] authorize: verifyBackupCode threw:", backupErr)
                }
              }

              if (!isValid) {
                await logLoginFailed(email, "Invalid 2FA code")
                return null
              }
            }
          }

          // Log successful login
          await logLogin(user.email, user.id)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          // Only log unexpected errors, not normal authentication failures
          console.error("Unexpected authorize error:", error)
          captureException(error, {
            tags: { component: "auth", action: "authorize" },
            level: "error",
          })
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | undefined }) {
      if (user) {
        // Initial sign-in: store the current sessionVersion in the JWT so we
        // can detect role changes (or other admin-triggered invalidations) on
        // subsequent requests.
        token.id = user.id
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id as string },
            select: { sessionVersion: true },
          })
          token.sessionVersion = dbUser?.sessionVersion ?? 1
        } catch {
          // Graceful fallback if sessionVersion column is missing (migration not yet applied)
          token.sessionVersion = 1
        }
        token.sessionVersionCheckedAt = Date.now()
        return token
      }

      // On subsequent calls, re-verify sessionVersion at most once every
      // 5 minutes to balance security with DB load.
      const checkedAt = token.sessionVersionCheckedAt as number | undefined
      const stale = !checkedAt || Date.now() - checkedAt > 5 * 60 * 1000
      if (stale && token.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { sessionVersion: true },
          })
          if (!dbUser || dbUser.sessionVersion !== (token.sessionVersion as number)) {
            // Session invalidated by a role change or admin action — return
            // null to destroy the token (NextAuth v5 treats this as sign-out).
            return null
          }
          token.sessionVersionCheckedAt = Date.now()
        } catch {
          // DB error — keep the existing token rather than logging everyone out
        }
      }

      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.AUTH_DEBUG === "true",
  // Required for Vercel deployments
  trustHost: true,
}

// Single NextAuth instance - export all from here to avoid multiple instances
const nextAuth = NextAuth(authOptions)

export const { auth, signIn, signOut } = nextAuth
export const { handlers } = nextAuth
