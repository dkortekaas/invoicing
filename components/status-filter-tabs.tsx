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

interface StatusOption {
  value: string
  label: string
  count: number
  href: string
}

interface StatusFilterTabsProps {
  currentStatus: string
  options: StatusOption[]
}

export function StatusFilterTabs({ currentStatus, options }: StatusFilterTabsProps) {
  const router = useRouter()
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
              {activeOption && `${activeOption.label} (${activeOption.count})`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({option.count})
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
                  {option.label} ({option.count})
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  )
}
