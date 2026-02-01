"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Lock, Unlock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatExchangeRate, formatDateLong } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ExchangeRateDisplayProps {
  fromCurrency?: string
  toCurrency: string
  rate?: number | null
  date?: Date | string | null
  source?: "ECB" | "MANUAL" | null
  isLocked?: boolean
  showRefresh?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
  compact?: boolean
  className?: string
}

export function ExchangeRateDisplay({
  fromCurrency = "EUR",
  toCurrency,
  rate,
  date,
  source,
  isLocked = false,
  showRefresh = false,
  onRefresh,
  isRefreshing = false,
  compact = false,
  className,
}: ExchangeRateDisplayProps) {
  const [currentRate, setCurrentRate] = useState(rate)
  const [currentDate, setCurrentDate] = useState(date)
  const [currentSource, setCurrentSource] = useState(source)
  const [loading, setLoading] = useState(!rate && toCurrency !== "EUR")

  // Fetch rate if not provided
  useEffect(() => {
    if (rate !== undefined || toCurrency === "EUR" || toCurrency === fromCurrency) {
      setCurrentRate(rate)
      setCurrentDate(date)
      setCurrentSource(source)
      setLoading(false)
      return
    }

    async function fetchRate() {
      try {
        const response = await fetch(
          `/api/exchange-rates/convert?from=${fromCurrency}&to=${toCurrency}&amount=1`
        )
        if (response.ok) {
          const data = await response.json()
          setCurrentRate(data.rate)
          setCurrentDate(data.rateDate)
          setCurrentSource(data.source)
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRate()
  }, [rate, date, source, fromCurrency, toCurrency])

  // No display needed for same currency or EUR to EUR
  if (toCurrency === fromCurrency || toCurrency === "EUR") {
    return null
  }

  if (loading) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Wisselkoers laden...
      </div>
    )
  }

  if (!currentRate) {
    return (
      <div className={cn("text-sm text-amber-600", className)}>
        Geen wisselkoers beschikbaar
      </div>
    )
  }

  const formattedRate = formatExchangeRate(currentRate, 4)
  const formattedDate = currentDate
    ? formatDateLong(new Date(currentDate))
    : null

  const sourceLabel =
    currentSource === "ECB" ? "ECB" : currentSource === "MANUAL" ? "Handmatig" : null

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1 text-sm text-muted-foreground",
                className
              )}
            >
              <span>
                1 {fromCurrency} = {formattedRate} {toCurrency}
              </span>
              {isLocked && <Lock className="h-3 w-3" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {sourceLabel && `${sourceLabel}, `}
              {formattedDate}
            </p>
            {isLocked && <p className="text-xs">Koers vastgezet</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/50 p-3 text-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              1 {fromCurrency} = {formattedRate} {toCurrency}
            </span>
            {isLocked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Lock className="h-4 w-4 text-green-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Koers vastgezet - kan niet meer gewijzigd worden</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Koers wordt vastgezet bij verzenden</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {sourceLabel && <span>{sourceLabel}</span>}
            {sourceLabel && formattedDate && <span>•</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        </div>

        {showRefresh && !isLocked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            <span className="ml-2">Ververs</span>
          </Button>
        )}
      </div>
    </div>
  )
}

// Small info icon with rate tooltip
export function ExchangeRateInfo({
  fromCurrency = "EUR",
  toCurrency,
  rate,
}: {
  fromCurrency?: string
  toCurrency: string
  rate?: number | null
}) {
  if (!rate || toCurrency === fromCurrency || toCurrency === "EUR") {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>
            1 {fromCurrency} = {formatExchangeRate(rate, 4)} {toCurrency}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
