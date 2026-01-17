"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface SearchFormProps {
  currentStatus?: string
}

export function SearchForm({ currentStatus }: SearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")

  useEffect(() => {
    const currentSearch = searchParams.get("search") || ""
    // Only update if search term actually changed
    if (searchTerm === currentSearch) {
      return
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set("search", searchTerm)
      } else {
        params.delete("search")
      }
      if (currentStatus && currentStatus !== "ALL") {
        params.set("status", currentStatus)
      }
      router.push(`/facturen?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, currentStatus, router])

  return (
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Zoek facturen..."
        className="pl-9"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  )
}
