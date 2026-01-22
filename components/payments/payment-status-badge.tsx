import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react"

type PaymentStatus = "open" | "pending" | "paid" | "failed" | "canceled" | "expired"

interface PaymentStatusBadgeProps {
  status: string
  showIcon?: boolean
  size?: "sm" | "default"
}

const statusConfig: Record<PaymentStatus, {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ComponentType<{ className?: string }>
  className?: string
}> = {
  open: {
    label: "In afwachting",
    variant: "outline",
    icon: Clock,
  },
  pending: {
    label: "In verwerking",
    variant: "secondary",
    icon: Loader2,
    className: "animate-spin",
  },
  paid: {
    label: "Betaald",
    variant: "default",
    icon: CheckCircle,
    className: "text-green-600",
  },
  failed: {
    label: "Mislukt",
    variant: "destructive",
    icon: XCircle,
  },
  canceled: {
    label: "Geannuleerd",
    variant: "secondary",
    icon: AlertCircle,
  },
  expired: {
    label: "Verlopen",
    variant: "outline",
    icon: Clock,
  },
}

export function PaymentStatusBadge({ status, showIcon = true, size = "default" }: PaymentStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as PaymentStatus
  const config = statusConfig[normalizedStatus] || {
    label: status,
    variant: "outline" as const,
    icon: AlertCircle,
  }

  const Icon = config.icon
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"

  return (
    <Badge variant={config.variant} className={size === "sm" ? "text-xs px-2 py-0" : ""}>
      {showIcon && <Icon className={`${iconSize} mr-1 ${config.className || ""}`} />}
      {config.label}
    </Badge>
  )
}
