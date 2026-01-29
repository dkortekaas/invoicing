"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "")

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? ""
    if (searchTerm === currentSearch) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set("search", searchTerm)
      } else {
        params.delete("search")
      }
      router.push(`/kosten?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, router, searchParams])

  return (
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Zoek kosten..."
        className={searchTerm ? "pl-9 pr-9" : "pl-9"}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setSearchTerm("")}
          aria-label="Zoekterm wissen"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
