"use client"

import { Badge } from "@/components/ui/badge"
import { STATUS_COLORS, cn } from "@/lib/utils"
import { useTranslatedUtils } from "@/components/providers/locale-provider"

interface InvoiceStatusBadgeProps {
  status: string
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const { STATUS_LABELS } = useTranslatedUtils()
  return (
    <Badge
      variant="secondary"
      className={cn(STATUS_COLORS[status], className)}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  )
}
