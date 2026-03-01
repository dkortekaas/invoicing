"use client"

import { Badge } from "@/components/ui/badge"
import { SIGNING_STATUS_COLORS, cn } from "@/lib/utils"
import { useTranslations } from "@/components/providers/locale-provider"

interface SigningStatusBadgeProps {
  /** null / undefined means NOT_SENT (signing not yet sent) */
  status: string | null | undefined
  className?: string
}

export function SigningStatusBadge({ status, className }: SigningStatusBadgeProps) {
  const { t } = useTranslations("quotesPage")
  const key = status ?? "NOT_SENT"

  const statusKeyMap: Record<string, string> = {
    NOT_SENT: "signingNotSent",
    PENDING: "signingPending",
    VIEWED: "signingViewed",
    SIGNED: "signingSigned",
    DECLINED: "signingDeclined",
    EXPIRED: "signingExpired",
  }

  const label = statusKeyMap[key] ? t(statusKeyMap[key]) : key

  return (
    <Badge
      variant="secondary"
      className={cn(SIGNING_STATUS_COLORS[key], className)}
    >
      {label}
    </Badge>
  )
}
