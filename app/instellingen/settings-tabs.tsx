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
import { useTranslations } from "@/components/providers/locale-provider"

const settingsTabs = [
  { value: "profiel", labelKey: "tabProfile" } as const,
  { value: "beveiliging", labelKey: "tabSecurity" } as const,
  { value: "bedrijfsgegevens", labelKey: "tabCompany" } as const,
  { value: "financiele-gegevens", labelKey: "tabFinancial" } as const,
  { value: "fiscaal", labelKey: "tabFiscal" } as const,
  { value: "email", labelKey: "tabEmail" } as const,
  { value: "betalingen", labelKey: "tabPayments" } as const,
  { value: "ondertekening", labelKey: "tabSigning" } as const,
  { value: "abonnement", labelKey: "tabSubscription" } as const,
  { value: "import-export", labelKey: "tabImportExport" } as const,
]

interface SettingsTabsProps {
  defaultTab: string
  children: React.ReactNode
}

export function SettingsTabs({ defaultTab, children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { t } = useTranslations("settingsPage")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(() => {
                const tab = settingsTabs.find((tab) => tab.value === activeTab)
                return tab ? t(tab.labelKey) : null
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {settingsTabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {t(tab.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <TabsList className="hidden md:grid w-full grid-cols-10">
        {settingsTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {t(tab.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  )
}
