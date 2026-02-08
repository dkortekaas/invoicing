"use client"

import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LayoutDashboard, Users, FileImage, CreditCard, Tag, Mail } from "lucide-react"

const tabs = [
  { value: "overzicht", label: "Overzicht", href: "/admin", icon: LayoutDashboard },
  { value: "users", label: "Gebruikers", href: "/admin/users", icon: Users },
  { value: "subscriptions", label: "Abonnementen", href: "/admin/subscriptions", icon: CreditCard },
  { value: "discount-codes", label: "Kortingscodes", href: "/admin/discount-codes", icon: Tag },
  { value: "watermark", label: "Watermerk", href: "/admin/watermark", icon: FileImage },
  { value: "newsletter", label: "Nieuwsbrief", href: "/admin/newsletter", icon: Mail },
] as const

export function AdminTabs() {
  const pathname = usePathname()
  const router = useRouter()

  const getActiveTab = () => {
    return tabs.find((tab) => tab.href === pathname)?.value ?? "overzicht"
  }

  const handleTabChange = (value: string) => {
    const tab = tabs.find((t) => t.value === value)
    if (tab) router.push(tab.href)
  }

  const activeTab = getActiveTab()
  const activeTabData = tabs.find((t) => t.value === activeTab)

  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {activeTabData && (
                <span className="flex items-center gap-2">
                  <activeTabData.icon className="h-4 w-4" />
                  {activeTabData.label}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <span className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  )
}
