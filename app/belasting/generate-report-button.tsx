"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { generateReport } from "./actions"

interface GenerateReportButtonProps {
  year: number
}

export function GenerateReportButton({ year }: GenerateReportButtonProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      await generateReport(year)
      toast.success(`Rapport ${year} gegenereerd`)
      router.refresh()
      router.push(`/belasting/${year}`)
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Fout bij genereren rapport")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-1 h-4 w-4" />
      )}
      Genereer
    </Button>
  )
}
