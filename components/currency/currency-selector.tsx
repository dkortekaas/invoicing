"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatExchangeRate } from "@/lib/utils"
import { cn } from "@/lib/utils"

// Currency flag emojis (ISO 3166-1 to flag)
const CURRENCY_FLAGS: Record<string, string> = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  CHF: "🇨🇭",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  PLN: "🇵🇱",
  CZK: "🇨🇿",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  JPY: "🇯🇵",
}

interface Currency {
  id: string
  code: string
  name: string
  nameDutch: string
  symbol: string
  decimalPlaces: number
  latestRate?: {
    rate: number
    date: Date
  } | null
}

interface CurrencySelectorProps {
  value: string
  onChange: (code: string) => void
  currencies?: Currency[]
  showRate?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CurrencySelector({
  value,
  onChange,
  currencies: propCurrencies,
  showRate = true,
  disabled = false,
  className,
  placeholder = "Selecteer valuta",
}: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<Currency[]>(propCurrencies || [])
  const [loading, setLoading] = useState(!propCurrencies)

  // Fetch currencies if not provided
  useEffect(() => {
    if (propCurrencies) {
      setCurrencies(propCurrencies)
      return
    }

    async function fetchCurrencies() {
      try {
        const response = await fetch(`/api/currencies?withRates=${showRate}`)
        if (response.ok) {
          const data = await response.json()
          setCurrencies(data.currencies)
        }
      } catch (error) {
        console.error("Failed to fetch currencies:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrencies()
  }, [propCurrencies, showRate])

  const selectedCurrency = currencies.find((c) => c.code === value)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={loading ? "Laden..." : placeholder}>
          {selectedCurrency && (
            <span className="flex items-center gap-2">
              <span>{CURRENCY_FLAGS[selectedCurrency.code] || "💱"}</span>
              <span>{selectedCurrency.code}</span>
              <span className="text-muted-foreground">
                ({selectedCurrency.symbol})
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center justify-between w-full gap-4">
              <span className="flex items-center gap-2">
                <span>{CURRENCY_FLAGS[currency.code] || "💱"}</span>
                <span className="font-medium">{currency.code}</span>
                <span className="text-muted-foreground">
                  {currency.nameDutch || currency.name}
                </span>
              </span>
              {showRate && currency.code !== "EUR" && currency.latestRate && (
                <span className="text-xs text-muted-foreground">
                  1 EUR = {formatExchangeRate(Number(currency.latestRate.rate), 4)}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Simple inline currency display
export function CurrencyBadge({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{CURRENCY_FLAGS[code] || "💱"}</span>
      <span>{code}</span>
    </span>
  )
}

// Currency flag only
export function CurrencyFlag({ code }: { code: string }) {
  return <span>{CURRENCY_FLAGS[code] || "💱"}</span>
}
