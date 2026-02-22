import { Badge } from "@/components/ui/badge"
import { SIGNING_STATUS_LABELS, SIGNING_STATUS_COLORS, cn } from "@/lib/utils"

interface SigningStatusBadgeProps {
  /** null / undefined betekent NOT_SENT (ondertekening nog niet verzonden) */
  status: string | null | undefined
  className?: string
}

export function SigningStatusBadge({ status, className }: SigningStatusBadgeProps) {
  const key = status ?? "NOT_SENT"
  return (
    <Badge
      variant="secondary"
      className={cn(SIGNING_STATUS_COLORS[key], className)}
    >
      {SIGNING_STATUS_LABELS[key] ?? key}
    </Badge>
  )
}
