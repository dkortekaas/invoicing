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
import { setReportStatus } from "../actions"

interface StatusSelectorProps {
  year: number
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Concept", description: "Nog in bewerking" },
  { value: "PROVISIONAL", label: "Voorlopig", description: "Voorlopige berekening" },
  { value: "FINAL", label: "Definitief", description: "Definitieve cijfers" },
  { value: "FILED", label: "Ingediend", description: "Ingediend bij Belastingdienst" },
] as const

export function StatusSelector({ year, currentStatus }: StatusSelectorProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(status: typeof STATUS_OPTIONS[number]["value"]) {
    if (status === currentStatus) return

    setIsUpdating(true)
    try {
      await setReportStatus(year, status)
      toast.success("Status bijgewerkt")
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Fout bij bijwerken status")
    } finally {
      setIsUpdating(false)
    }
  }

  const currentLabel =
    STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.label || "Status"

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
              {option.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
