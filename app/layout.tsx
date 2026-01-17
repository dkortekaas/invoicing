import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AuthProvider } from "@/components/providers/session-provider"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BetaalMe",
  description: "Gemaakt om betaald te worden.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
