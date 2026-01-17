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

const navigation = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Facturen",
    url: "/facturen",
    icon: FileText,
  },
  {
    title: "Abonnementen",
    url: "/abonnementen",
    icon: Repeat,
  },
  {
    title: "Tijdregistratie",
    url: "/tijd",
    icon: Clock,
  },
  {
    title: "Klanten",
    url: "/klanten",
    icon: Users,
  },
  {
    title: "Producten",
    url: "/producten",
    icon: Package,
  },
  {
    title: "BTW",
    url: "/btw",
    icon: Receipt,
  },
  {
    title: "Instellingen",
    url: "/instellingen",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if user is admin
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin))
      .catch(() => setIsAdmin(false))
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
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Facturatie</span>
                  <span className="truncate text-xs">BetaalMe</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
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
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/admin')}>
                    <Link href="/admin">
                      <Shield />
                      <span>Admin</span>
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
              <span>Uitloggen</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
