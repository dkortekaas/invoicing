import { Badge } from "@/components/ui/badge"
import { CREDIT_NOTE_STATUS_LABELS, CREDIT_NOTE_STATUS_COLORS, cn } from "@/lib/utils"

interface CreditNoteStatusBadgeProps {
  status: string
  className?: string
}

export function CreditNoteStatusBadge({ status, className }: CreditNoteStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(CREDIT_NOTE_STATUS_COLORS[status], className)}
    >
      {CREDIT_NOTE_STATUS_LABELS[status] || status}
    </Badge>
  )
}
