"use client"

import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, Users, FileImage, CreditCard, Tag } from "lucide-react"

export function AdminTabs() {
  const pathname = usePathname()
  const router = useRouter()

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === "/admin") return "overzicht"
    if (pathname === "/admin/users") return "users"
    if (pathname === "/admin/subscriptions") return "subscriptions"
    if (pathname === "/admin/discount-codes") return "discount-codes"
    if (pathname === "/admin/watermark") return "watermark"
    return "overzicht"
  }

  const handleTabChange = (value: string) => {
    switch (value) {
      case "overzicht":
        router.push("/admin")
        break
      case "users":
        router.push("/admin/users")
        break
      case "subscriptions":
        router.push("/admin/subscriptions")
        break
      case "discount-codes":
        router.push("/admin/discount-codes")
        break
      case "watermark":
        router.push("/admin/watermark")
        break
    }
  }

  return (
    <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="overzicht" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Overzicht
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Gebruikers
        </TabsTrigger>
        <TabsTrigger value="subscriptions" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Abonnementen
        </TabsTrigger>
        <TabsTrigger value="discount-codes" className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Kortingscodes
        </TabsTrigger>
        <TabsTrigger value="watermark" className="flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Watermerk
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
