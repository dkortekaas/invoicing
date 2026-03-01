"use client"

import { Badge } from "@/components/ui/badge"
import { QUOTE_STATUS_COLORS, cn } from "@/lib/utils"
import { useTranslations } from "@/components/providers/locale-provider"

interface QuoteStatusBadgeProps {
  status: string
  className?: string
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const { t } = useTranslations("quotesPage")

  const statusKeyMap: Record<string, string> = {
    DRAFT: "statusDraft",
    SENT: "statusSent",
    VIEWED: "statusViewed",
    SIGNED: "statusSigned",
    DECLINED: "statusDeclined",
    EXPIRED: "statusExpired",
    CONVERTED: "statusConverted",
  }

  const label = statusKeyMap[status] ? t(statusKeyMap[status]) : status

  return (
    <Badge
      variant="secondary"
      className={cn(QUOTE_STATUS_COLORS[status], className)}
    >
      {label}
    </Badge>
  )
}
