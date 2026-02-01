"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Check, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatExchangeRate, formatDateLong } from "@/lib/utils"
import { saveCurrencySettings } from "./actions"

// Currency flag emojis
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
  isDefault: boolean
  latestRate: {
    rate: number
    date: Date
    source: string
  } | null
}

interface Settings {
  baseCurrencyId: string
  enabledCurrencyIds: string[]
  lockRateOn: "CREATE" | "SEND" | "MANUAL"
  showBaseEquivalent: boolean
  autoFetchRates: boolean
}

interface CurrencySettingsFormProps {
  currencies: Currency[]
  settings: Settings
}

export function CurrencySettingsForm({
  currencies,
  settings: initialSettings,
}: CurrencySettingsFormProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null)

  const otherCurrencies = currencies.filter((c) => c.code !== "EUR")

  const toggleCurrency = (currencyId: string) => {
    const isEnabled = settings.enabledCurrencyIds.includes(currencyId)
    if (isEnabled) {
      // Don't allow disabling EUR
      if (currencies.find((c) => c.id === currencyId)?.code === "EUR") {
        return
      }
      setSettings({
        ...settings,
        enabledCurrencyIds: settings.enabledCurrencyIds.filter((id) => id !== currencyId),
      })
    } else {
      setSettings({
        ...settings,
        enabledCurrencyIds: [...settings.enabledCurrencyIds, currencyId],
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveCurrencySettings(settings)
      router.refresh()
    } catch (error) {
      console.error("Failed to save currency settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setLastSyncResult(null)
    try {
      const response = await fetch("/api/cron/sync-exchange-rates", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success") {
          setLastSyncResult(`${data.synced} wisselkoersen bijgewerkt`)
        } else if (data.status === "skipped") {
          setLastSyncResult("Wisselkoersen zijn al actueel")
        }
        router.refresh()
      } else {
        setLastSyncResult("Synchronisatie mislukt")
      }
    } catch (error) {
      console.error("Failed to sync rates:", error)
      setLastSyncResult("Synchronisatie mislukt")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Base Currency - Fixed to EUR for Dutch users */}
      <Card>
        <CardHeader>
          <CardTitle>Basisvaluta</CardTitle>
          <CardDescription>
            Je basisvaluta is EUR. Dit wordt gebruikt voor BTW-rapportages en boekhouding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
            <span className="text-2xl">{CURRENCY_FLAGS.EUR}</span>
            <div>
              <p className="font-medium">Euro (EUR)</p>
              <p className="text-sm text-muted-foreground">
                Alle factuurbedragen worden ook in EUR equivalent berekend
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enabled Currencies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Beschikbare valuta&apos;s</CardTitle>
            <CardDescription>
              Selecteer welke valuta&apos;s je wilt gebruiken voor facturering
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Synchroniseren..." : "Koersen ophalen"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastSyncResult && (
            <p className="text-sm text-muted-foreground">{lastSyncResult}</p>
          )}

          {/* EUR is always enabled */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Checkbox checked disabled />
              <span className="text-xl">{CURRENCY_FLAGS.EUR}</span>
              <div>
                <p className="font-medium">EUR - Euro</p>
                <p className="text-sm text-muted-foreground">Basisvaluta (altijd actief)</p>
              </div>
            </div>
          </div>

          {/* Other currencies */}
          {otherCurrencies.map((currency) => {
            const isEnabled = settings.enabledCurrencyIds.includes(currency.id)
            return (
              <div
                key={currency.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleCurrency(currency.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={() => toggleCurrency(currency.id)}
                  />
                  <span className="text-xl">{CURRENCY_FLAGS[currency.code] || "💱"}</span>
                  <div>
                    <p className="font-medium">
                      {currency.code} - {currency.nameDutch}
                    </p>
                    <p className="text-sm text-muted-foreground">{currency.symbol}</p>
                  </div>
                </div>
                {currency.latestRate && (
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      1 EUR = {formatExchangeRate(currency.latestRate.rate, 4)} {currency.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(new Date(currency.latestRate.date))}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Rate Lock Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Koers vastzetten
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Bepaalt wanneer de wisselkoers wordt vastgezet. Na het vastzetten
                    kan de koers niet meer gewijzigd worden en worden EUR equivalenten
                    definitief berekend.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Wanneer moet de wisselkoers worden vastgezet?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.lockRateOn}
            onValueChange={(value) =>
              setSettings({
                ...settings,
                lockRateOn: value as "CREATE" | "SEND" | "MANUAL",
              })
            }
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="SEND" id="lock-send" className="mt-1" />
              <Label htmlFor="lock-send" className="cursor-pointer">
                <p className="font-medium">Bij verzenden (Aanbevolen)</p>
                <p className="text-sm text-muted-foreground">
                  De koers wordt vastgezet zodra je de factuur verzendt
                </p>
              </Label>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="CREATE" id="lock-create" className="mt-1" />
              <Label htmlFor="lock-create" className="cursor-pointer">
                <p className="font-medium">Bij aanmaken</p>
                <p className="text-sm text-muted-foreground">
                  De koers wordt direct vastgezet bij het aanmaken van de factuur
                </p>
              </Label>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="MANUAL" id="lock-manual" className="mt-1" />
              <Label htmlFor="lock-manual" className="cursor-pointer">
                <p className="font-medium">Handmatig</p>
                <p className="text-sm text-muted-foreground">
                  Je kiest zelf wanneer de koers wordt vastgezet
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Weergave</CardTitle>
          <CardDescription>
            Hoe worden niet-EUR bedragen weergegeven?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Toon EUR equivalent</Label>
              <p className="text-sm text-muted-foreground">
                Toon altijd het EUR equivalent naast buitenlandse bedragen
              </p>
            </div>
            <Checkbox
              checked={settings.showBaseEquivalent}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showBaseEquivalent: checked as boolean })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Annuleren
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Opslaan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
