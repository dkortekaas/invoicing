"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Bell, User, LogOut, Settings } from "lucide-react"
import { RunningTimerIndicator } from "@/components/time/running-timer-indicator"
import { LanguageSwitcher } from "@/components/language-switcher"
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
import { useTranslations } from "@/components/providers/locale-provider"

const pathToPageKey: Record<string, string> = {
  "/": "dashboard",
  "/facturen": "invoices",
  "/facturen/nieuw": "newInvoice",
  "/tijd": "time",
  "/tijd/entries": "timeEntries",
  "/tijd/projecten": "projects",
  "/klanten": "customers",
  "/klanten/nieuw": "newCustomer",
  "/producten": "products",
  "/instellingen": "settings",
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useTranslations("dashboard")

  let pageKey = pathToPageKey[pathname]
  if (!pageKey) {
    if (pathname.startsWith("/facturen/")) pageKey = "invoice"
    else if (pathname.startsWith("/klanten/")) pageKey = "customer"
    else if (pathname.startsWith("/tijd/")) pageKey = "time"
    else pageKey = "dashboard"
  }
  const title = t(`pages.${pageKey}`)

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
        <LanguageSwitcher />
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">{t("notifications")}</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">{t("userMenu")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{session?.user?.name || t("user")}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/instellingen">
                <Settings className="mr-2 h-4 w-4" />
                {t("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/instellingen?tab=2fa">
                <Settings className="mr-2 h-4 w-4" />
                {t("twoFactor")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
