"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/providers/locale-provider"
import { generateReport } from "./actions"

interface GenerateReportButtonProps {
  year: number
}

export function GenerateReportButton({ year }: GenerateReportButtonProps) {
  const router = useRouter()
  const { t } = useTranslations("taxPage")
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      await generateReport(year)
      toast.success(`${t("generateSuccess")} ${year}`)
      router.refresh()
      router.push(`/belasting/${year}`)
    } catch (error) {
      console.error("Generate report error:", error)
      toast.error(t("generateError"))
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
      {t("generateReport")}
    </Button>
  )
}
