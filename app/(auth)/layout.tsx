import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inloggen - BetaalMe",
  description: "Inloggen op je BetaalMe account", 
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
