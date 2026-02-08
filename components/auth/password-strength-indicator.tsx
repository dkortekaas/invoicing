"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

const LABELS: Record<PasswordStrength, string> = {
  0: "",
  1: "Zwak",
  2: "Matig",
  3: "Redelijk",
  4: "Sterk",
}

const BAR_BG: Record<PasswordStrength, string> = {
  0: "bg-muted",
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-green-600",
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (score <= 0) return 0
  if (score <= 2) return 1
  if (score <= 3) return 2
  if (score <= 4) return 3
  return 4
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password])
  const width = strength * 25 // 0, 25, 50, 75, 100

  if (!password) return null

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              BAR_BG[strength]
            )}
            style={{ width: `${width}%` }}
          />
        </div>
        <span
          className={cn(
            "text-xs font-medium tabular-nums transition-colors",
            strength === 0 && "text-muted-foreground",
            strength === 1 && "text-red-600",
            strength === 2 && "text-amber-600",
            strength === 3 && "text-lime-600",
            strength === 4 && "text-green-700"
          )}
        >
          {LABELS[strength]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Gebruik minimaal 6 tekens; sterker met hoofdletters, cijfers en
        leestekens.
      </p>
    </div>
  )
}
