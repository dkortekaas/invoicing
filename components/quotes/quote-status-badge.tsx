import { Badge } from "@/components/ui/badge"
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, cn } from "@/lib/utils"

interface QuoteStatusBadgeProps {
  status: string
  className?: string
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(QUOTE_STATUS_COLORS[status], className)}
    >
      {QUOTE_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
