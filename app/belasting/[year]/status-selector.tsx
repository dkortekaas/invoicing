"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "@/components/providers/locale-provider"
import { setReportStatus } from "../actions"

interface StatusSelectorProps {
  year: number
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: "DRAFT" as const, labelKey: "statusDraft", descKey: "statusDraftDesc" },
  { value: "PROVISIONAL" as const, labelKey: "statusProvisional", descKey: "statusProvisionalDesc" },
  { value: "FINAL" as const, labelKey: "statusFinal", descKey: "statusFinalDesc" },
  { value: "FILED" as const, labelKey: "statusFiled", descKey: "statusFiledDesc" },
]

export function StatusSelector({ year, currentStatus }: StatusSelectorProps) {
  const router = useRouter()
  const { t } = useTranslations("taxPage")
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(status: (typeof STATUS_OPTIONS)[number]["value"]) {
    if (status === currentStatus) return

    setIsUpdating(true)
    try {
      await setReportStatus(year, status)
      toast.success(t("statusUpdateSuccess"))
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error(t("statusUpdateError"))
    } finally {
      setIsUpdating(false)
    }
  }

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === currentStatus)
  const currentLabel = currentOption ? t(currentOption.labelKey) : t("colStatus")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isUpdating}>
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="flex flex-col items-start"
          >
            <span
              className={
                option.value === currentStatus ? "font-semibold" : ""
              }
            >
              {t(option.labelKey)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t(option.descKey)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
