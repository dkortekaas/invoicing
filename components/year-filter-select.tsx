"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "@/components/providers/locale-provider"

interface YearFilterSelectProps {
  years: number[]
  currentYear: string | null
}

export function YearFilterSelect({ years, currentYear }: YearFilterSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslations("common")

  function onValueChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.set("year", "all")
    } else {
      params.set("year", value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentYear === "all" ? "all" : (currentYear ?? String(new Date().getFullYear()))} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={t("yearFilterPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("yearFilterAllYears")}</SelectItem>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
