import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { CurrencySettingsForm } from "./currency-settings-form"

export const dynamic = "force-dynamic"

export default async function ValutaSettingsPage() {
  const userId = await getCurrentUserId()

  // Get all active currencies
  const currencies = await db.currency.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  // Get user's currency settings
  const settings = await db.currencySettings.findUnique({
    where: { userId },
    include: {
      baseCurrency: true,
      enabledCurrencies: true,
    },
  })

  // Get latest exchange rates for display
  const latestRates = await db.exchangeRate.findMany({
    orderBy: { date: "desc" },
    distinct: ["currencyCode"],
    take: currencies.length,
  })

  // Map currencies with their rates
  const currenciesWithRates = currencies.map((currency) => {
    const rate = latestRates.find((r) => r.currencyCode === currency.code)
    return {
      ...currency,
      latestRate: rate
        ? {
            rate: rate.rate.toNumber(),
            date: rate.date,
            source: rate.source,
          }
        : null,
    }
  })

  // Default settings if user doesn't have any
  const eurCurrency = currencies.find((c) => c.code === "EUR")
  const defaultSettings = settings
    ? {
        baseCurrencyId: settings.baseCurrencyId,
        enabledCurrencyIds: settings.enabledCurrencies.map((c) => c.id),
        lockRateOn: settings.lockRateOn,
        showBaseEquivalent: settings.showBaseEquivalent,
        autoFetchRates: settings.autoFetchRates,
      }
    : {
        baseCurrencyId: eurCurrency?.id || "",
        enabledCurrencyIds: eurCurrency ? [eurCurrency.id] : [],
        lockRateOn: "SEND" as const,
        showBaseEquivalent: true,
        autoFetchRates: true,
      }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Valuta-instellingen</h2>
        <p className="text-muted-foreground">
          Configureer welke valuta&apos;s beschikbaar zijn voor facturering
        </p>
      </div>

      <CurrencySettingsForm
        currencies={currenciesWithRates}
        settings={defaultSettings}
      />
    </div>
  )
}
