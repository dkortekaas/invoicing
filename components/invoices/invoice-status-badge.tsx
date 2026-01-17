import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils"

interface InvoiceStatusBadgeProps {
  status: string
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(STATUS_COLORS[status], className)}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  )
}
