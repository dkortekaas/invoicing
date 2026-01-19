"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Bell, User, LogOut, Settings } from "lucide-react"
import { RunningTimerIndicator } from "@/components/time/running-timer-indicator"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const pageTitle: Record<string, string> = {
  "/": "Dashboard",
  "/facturen": "Facturen",
  "/facturen/nieuw": "Nieuwe Factuur",
  "/tijd": "Tijdregistratie",
  "/tijd/entries": "Time Entries",
  "/tijd/projecten": "Projecten",
  "/klanten": "Klanten",
  "/klanten/nieuw": "Nieuwe Klant",
  "/producten": "Producten",
  "/instellingen": "Instellingen",
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Bepaal de pagina titel
  let title = pageTitle[pathname]
  if (!title) {
    if (pathname.startsWith("/facturen/")) title = "Factuur"
    else if (pathname.startsWith("/klanten/")) title = "Klant"
    else if (pathname.startsWith("/tijd/")) title = "Tijdregistratie"
    else title = "Dashboard"
  }

  const handleLogout = async () => {
    // Log logout action before signing out
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      // Don't block logout if logging fails
      console.error("Failed to log logout:", error)
    }
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Running Timer Indicator */}
        <RunningTimerIndicator />
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaties</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Gebruikersmenu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{session?.user?.name || "Gebruiker"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/instellingen">
                <Settings className="mr-2 h-4 w-4" />
                Instellingen
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/instellingen?tab=2fa">
                <Settings className="mr-2 h-4 w-4" />
                2FA Beveiliging
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
