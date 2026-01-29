"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface SortableTableHeadProps {
  sortKey: string
  children: React.ReactNode
  className?: string
}

export function SortableTableHead({ sortKey, children, className }: SortableTableHeadProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSortBy = searchParams.get("sortBy") ?? null
  const currentOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc"
  const isActive = currentSortBy === sortKey
  const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc"

  const params = new URLSearchParams(searchParams.toString())
  params.set("sortBy", sortKey)
  params.set("sortOrder", nextOrder)
  const href = `${pathname}?${params.toString()}`

  return (
    <TableHead className={cn(className)}>
      <Link
        href={href}
        className="inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        {children}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowDown className="h-4 w-4" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </Link>
    </TableHead>
  )
}
