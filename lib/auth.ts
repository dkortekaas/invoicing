import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import speakeasy from "speakeasy"
import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"
import { verifyBackupCode, sanitizeBase32Secret } from "./auth-utils"
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

            let isValid = false

            // Eerst proberen als TOTP (6 cijfers; eventueel leading zero)
            if (
              user.twoFactorSecret &&
              /^\d+$/.test(twoFactorCode) &&
              twoFactorCode.length <= 6
            ) {
              const token = twoFactorCode.padStart(6, "0")
              const secret = sanitizeBase32Secret(user.twoFactorSecret)
              if (secret) {
                isValid = speakeasy.totp.verify({
                  secret,
                  encoding: "base32",
                  token,
                  window: 1, // ±30 seconden voor klokverschil
                })
              }
            }

            // If TOTP verification failed, try backup code (8 digits)
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
        token.id = user.id
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
  debug: process.env.NODE_ENV === "development",
  // Required for Vercel deployments
  trustHost: true,
}

// Single NextAuth instance - export all from here to avoid multiple instances
const nextAuth = NextAuth(authOptions)

export const { auth, signIn, signOut } = nextAuth
export const { handlers } = nextAuth
