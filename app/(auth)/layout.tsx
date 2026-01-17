import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { AuthProvider } from "@/components/providers/session-provider"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Inloggen - BetaalMe",
  description: "Inloggen op je BetaalMe account", 
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
