"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Settings,
  LogOut,
  Clock,
  Repeat,
  Receipt,
  Shield,
  History,
  Euro,
  FileX,
  Calculator,
  ScrollText,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Logo from "@/components/marketing/logo"
import { useTranslations } from "@/components/providers/locale-provider"

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useTranslations("dashboard")

  const navigation = [
    {
      title: t("pages.dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("pages.invoices"),
      url: "/facturen",
      icon: FileText,
    },
    {
      title: t("pages.quotes"),
      url: "/offertes",
      icon: ScrollText,
    },
    {
      title: t("pages.creditNotes"),
      url: "/creditnotas",
      icon: FileX,
    },
    {
      title: t("pages.subscriptions"),
      url: "/abonnementen",
      icon: Repeat,
    },
    {
      title: t("pages.time"),
      url: "/tijd",
      icon: Clock,
    },
    {
      title: t("pages.customers"),
      url: "/klanten",
      icon: Users,
    },
    {
      title: t("pages.products"),
      url: "/producten",
      icon: Package,
    },
    {
      title: t("pages.expenses"),
      url: "/kosten",
      icon: Euro,
    },
    {
      title: t("pages.vat"),
      url: "/btw",
      icon: Receipt,
    },
    {
      title: t("pages.tax"),
      url: "/belasting",
      icon: Calculator,
    },
    {
      title: t("pages.settings"),
      url: "/instellingen",
      icon: Settings,
    },
  ]
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperuser, setIsSuperuser] = useState(false)

  useEffect(() => {
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin ?? false)
        setIsSuperuser(data.isSuperuser ?? false)
      })
      .catch(() => {
        setIsAdmin(false)
        setIsSuperuser(false)
      })
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex-1 flex items-center min-w-0">
                  <Logo asLink={false} />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url))

                return (
                  <SidebarMenuItem key={item.title} className="py-1">
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              {isAdmin && (
                <SidebarMenuItem className="py-1">
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/audit-logs')}>
                    <Link href="/audit-logs">
                      <History />
                      <span>{t("sidebar.auditLog")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isSuperuser && (
                <SidebarMenuItem className="py-1">
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/admin')}>
                    <Link href="/admin">
                      <Shield />
                      <span>{t("sidebar.admin")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>{t("logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
