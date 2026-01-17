import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import speakeasy from "speakeasy"
import NextAuth from "next-auth"
import { verifyBackupCode } from "./auth-utils"

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
            // User not found - don't log as this is a normal failed login attempt
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            password,
            user.passwordHash
          )

          if (!isValidPassword) {
            // Invalid password - don't log as this is a normal failed login attempt
            return null
          }

          // If 2FA is enabled, verify the code
          if (user.twoFactorEnabled) {
            const twoFactorCode = credentials.twoFactorCode as string | undefined
            if (!twoFactorCode) {
              // 2FA is required but not provided
              // The login page should have checked this via /api/auth/check-2fa first
              // This is expected behavior, not an error
              return null
            }

            let isValid = false

            // First try to verify as TOTP code
            if (user.twoFactorSecret) {
              isValid = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: "base32",
                token: twoFactorCode,
                window: 2, // Allow 2 time steps before/after
              })
            }

            // If TOTP verification failed, try backup code
            if (!isValid) {
              isValid = await verifyBackupCode(user.id, twoFactorCode)
            }

            if (!isValid) {
              // Invalid 2FA code (neither TOTP nor backup code) - don't log as this is a normal failed login attempt
              return null
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          // Only log unexpected errors, not normal authentication failures
          console.error("Unexpected authorize error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.requiresTwoFactor = (user as any).requiresTwoFactor
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
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
  debug: false, // Set to false to reduce console noise
}

// Export auth function for use in server components
export const { auth } = NextAuth(authOptions)
