"use client"

import { Badge } from "@/components/ui/badge"
import { CREDIT_NOTE_STATUS_COLORS, cn } from "@/lib/utils"
import { useTranslations } from "@/components/providers/locale-provider"

interface CreditNoteStatusBadgeProps {
  status: string
  className?: string
}

const STATUS_KEY_MAP: Record<string, string> = {
  DRAFT: "statusDraft",
  FINAL: "statusFinal",
  SENT: "statusSent",
  PROCESSED: "statusProcessed",
  REFUNDED: "statusRefunded",
}

export function CreditNoteStatusBadge({ status, className }: CreditNoteStatusBadgeProps) {
  const { t } = useTranslations("creditNotesPage")
  const label = STATUS_KEY_MAP[status] ? t(STATUS_KEY_MAP[status]) : status
  return (
    <Badge
      variant="secondary"
      className={cn(CREDIT_NOTE_STATUS_COLORS[status], className)}
    >
      {label}
    </Badge>
  )
}
