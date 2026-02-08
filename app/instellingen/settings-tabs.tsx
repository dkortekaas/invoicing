"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const settingsTabs = [
  { value: "profiel", label: "Profiel" },
  { value: "beveiliging", label: "Beveiliging" },
  { value: "bedrijfsgegevens", label: "Bedrijf" },
  { value: "financiele-gegevens", label: "Financieel" },
  { value: "fiscaal", label: "Fiscaal" },
  { value: "email", label: "Email" },
  { value: "betalingen", label: "Betalingen" },
  { value: "import-export", label: "Import/Export" },
] as const

interface SettingsTabsProps {
  defaultTab: string
  children: React.ReactNode
}

export function SettingsTabs({ defaultTab, children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {settingsTabs.find((t) => t.value === activeTab)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {settingsTabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <TabsList className="hidden md:grid w-full grid-cols-8">
        {settingsTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  )
}
