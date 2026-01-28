"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { generateReport } from "../actions"

interface RefreshReportButtonProps {
  year: number
}

export function RefreshReportButton({ year }: RefreshReportButtonProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await generateReport(year)
      toast.success("Rapport bijgewerkt")
      router.refresh()
    } catch (error) {
      console.error("Error refreshing report:", error)
      toast.error("Fout bij bijwerken rapport")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      {isRefreshing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      Herberekenen
    </Button>
  )
}
