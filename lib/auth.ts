import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import speakeasy from "speakeasy"
import NextAuth from "next-auth"

export const authOptions: NextAuthOptions = {
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

          const user = await db.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isValidPassword) {
            return null
          }

          // If 2FA is enabled, verify the code
          if (user.twoFactorEnabled) {
            if (!credentials.twoFactorCode) {
              // Return null to indicate 2FA is required
              // The login page will handle this
              return null
            }

            if (!user.twoFactorSecret) {
              return null
            }

            // Verify TOTP code
            const isValid = speakeasy.totp.verify({
              secret: user.twoFactorSecret,
              encoding: "base32",
              token: credentials.twoFactorCode,
              window: 2, // Allow 2 time steps before/after
            })

            if (!isValid) {
              return null
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Authorize error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.requiresTwoFactor = (user as any).requiresTwoFactor
      }
      return token
    },
    async session({ session, token }) {
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
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// Export auth function for use in server components
export const { auth } = NextAuth(authOptions)
