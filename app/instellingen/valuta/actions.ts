"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"

interface CurrencySettingsInput {
  baseCurrencyId: string
  enabledCurrencyIds: string[]
  lockRateOn: "CREATE" | "SEND" | "MANUAL"
  showBaseEquivalent: boolean
  autoFetchRates?: boolean
}

export async function saveCurrencySettings(settings: CurrencySettingsInput) {
  const userId = await getCurrentUserId()

  // Get EUR currency to ensure it's always enabled
  const eurCurrency = await db.currency.findUnique({
    where: { code: "EUR" },
  })

  if (!eurCurrency) {
    throw new Error("EUR currency not found")
  }

  // Ensure EUR is always in the enabled list
  const enabledCurrencyIds = settings.enabledCurrencyIds.includes(eurCurrency.id)
    ? settings.enabledCurrencyIds
    : [eurCurrency.id, ...settings.enabledCurrencyIds]

  // Check if settings exist
  const existingSettings = await db.currencySettings.findUnique({
    where: { userId },
  })

  if (existingSettings) {
    // Update existing settings
    await db.currencySettings.update({
      where: { userId },
      data: {
        baseCurrencyId: eurCurrency.id, // Always EUR for Dutch users
        lockRateOn: settings.lockRateOn,
        showBaseEquivalent: settings.showBaseEquivalent,
        autoFetchRates: settings.autoFetchRates ?? true,
        enabledCurrencies: {
          set: enabledCurrencyIds.map((id) => ({ id })),
        },
      },
    })
  } else {
    // Create new settings
    await db.currencySettings.create({
      data: {
        userId,
        baseCurrencyId: eurCurrency.id,
        lockRateOn: settings.lockRateOn,
        showBaseEquivalent: settings.showBaseEquivalent,
        autoFetchRates: settings.autoFetchRates ?? true,
        enabledCurrencies: {
          connect: enabledCurrencyIds.map((id) => ({ id })),
        },
      },
    })
  }

  revalidatePath("/instellingen/valuta")
  revalidatePath("/facturen")
}
