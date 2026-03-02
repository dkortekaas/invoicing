"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Messages } from "@/lib/i18n"
import { useLocale } from "@/components/providers/locale-provider"

interface StatusOption {
  value: string
  /** Pre-translated label (legacy). */
  label?: string
  /** Translation key — used together with the parent's namespace prop. */
  labelKey?: string
  count: number
  href: string
}

interface StatusFilterTabsProps {
  currentStatus: string
  options: StatusOption[]
  /** When provided, labels are translated client-side via labelKey (instant on locale change). */
  namespace?: keyof Messages
}

export function StatusFilterTabs({ currentStatus, options, namespace }: StatusFilterTabsProps) {
  const router = useRouter()
  const { t } = useLocale()

  function getLabel(option: StatusOption): string {
    if (namespace && option.labelKey) return t(namespace, option.labelKey)
    return option.label ?? option.value
  }

  const activeOption = options.find((o) => o.value === currentStatus)

  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select
          value={currentStatus}
          onValueChange={(value) => {
            const option = options.find((o) => o.value === value)
            if (option) router.push(option.href)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {activeOption && `${getLabel(activeOption)} (${activeOption.count})`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {getLabel(option)} ({option.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <div className="hidden md:block">
        <Tabs defaultValue={currentStatus}>
          <TabsList>
            {options.map((option) => (
              <TabsTrigger key={option.value} value={option.value} asChild>
                <Link href={option.href}>
                  {getLabel(option)} ({option.count})
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  )
}
