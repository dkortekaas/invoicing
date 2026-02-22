"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "./header"
import { Separator } from "@/components/ui/separator"
import MarketingHeader from "@/components/marketing/header"
import Footer from "@/components/marketing/footer"

const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/facturen",
  "/klanten",
  "/producten",
  "/kosten",
  "/abonnementen",
  "/abonnement",
  "/btw",
  "/belasting",
  "/tijd",
  "/activa",
  "/admin",
  "/instellingen",
  "/creditnotas",
  "/upgrade",
  "/audit-logs",
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Don't show dashboard layout for auth pages, marketing pages, and payment pages
  if (
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/functies") ||
    pathname === "/" ||
    pathname === "/prijzen" ||
    pathname === "/contact" ||
    pathname === "/help" ||
    pathname === "/help/videos" ||
    pathname === "/over-ons" ||
    pathname === "/nieuwsbrief" ||
    pathname?.startsWith("/en") ||
    pathname?.startsWith("/uitnodiging") ||
    pathname?.startsWith("/pay")
  ) {
    return <>{children}</>
  }

  // Legal pages and unknown paths: use marketing layout (Header + Footer, no sidebar)
  const isKnownAppRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  )
  if (pathname && !isKnownAppRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MarketingHeader />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <Separator />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
