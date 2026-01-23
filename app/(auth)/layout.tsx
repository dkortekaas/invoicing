import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inloggen - Declair",
  description: "Inloggen op je Declair account", 
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
