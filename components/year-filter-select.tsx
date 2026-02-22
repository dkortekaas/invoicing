"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface YearFilterSelectProps {
  years: number[]
  currentYear: string | null
}

export function YearFilterSelect({ years, currentYear }: YearFilterSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
        <SelectValue placeholder="Jaar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Alle jaren</SelectItem>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
