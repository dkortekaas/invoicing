import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"
import { verifyBackupCode, verifyTwoFactorCode } from "./auth-utils"
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
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const email = credentials.email as string
          const password = credentials.password as string

          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            // Log failed login attempt
            await logLoginFailed(email, "User not found")
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            password,
            user.passwordHash
          )

          if (!isValidPassword) {
            // Log failed login attempt
            await logLoginFailed(email, "Invalid password")
            return null
          }

          // If 2FA is enabled, verify the code
          if (user.twoFactorEnabled) {
            const rawCode = credentials.twoFactorCode as string | undefined
            const twoFactorCode =
              typeof rawCode === "string" ? rawCode.trim().replace(/\s/g, "") : ""
            if (!twoFactorCode) {
              // 2FA is required but not provided
              // The login page should have checked this via /api/auth/check-2fa first
              // This is expected behavior, not an error
              return null
            }

            // Probeer TOTP via de centrale utility (window: 10 = ±5 min kloktolerantie)
            let isValid = verifyTwoFactorCode(user.twoFactorSecret ?? "", twoFactorCode)

            // Als TOTP mislukt: probeer backup code (8 cijfers)
            if (!isValid) {
              isValid = await verifyBackupCode(user.id, twoFactorCode)
            }

            if (!isValid) {
              // Log failed login attempt
              await logLoginFailed(email, "Invalid 2FA code")
              return null
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
        const dbUser = await db.user.findUnique({
          where: { id: user.id as string },
          select: { sessionVersion: true },
        })
        token.sessionVersion = dbUser?.sessionVersion ?? 1
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
