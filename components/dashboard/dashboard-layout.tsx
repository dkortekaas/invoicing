"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "./header"
import { Separator } from "@/components/ui/separator"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Don't show dashboard layout for auth pages, marketing pages, and payment pages
  // Auth is handled by middleware - no client-side check needed
  if (
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname === "/" ||
    pathname === "/prijzen" ||
    pathname?.startsWith("/uitnodiging") ||
    pathname?.startsWith("/pay")
  ) {
    return <>{children}</>
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
