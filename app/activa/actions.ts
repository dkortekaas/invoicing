"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { assetSchema, type AssetFormData } from "@/lib/validations"
import {
  generateDepreciationSchedule,
  calculateCurrentBookValue,
} from "@/lib/tax/depreciation"

// Get all assets for the current user
export async function getAssets() {
  const userId = await getCurrentUserId()

  const assets = await db.asset.findMany({
    where: { userId },
    orderBy: { purchaseDate: "desc" },
    include: {
      depreciationEntries: {
        orderBy: { year: "desc" },
        take: 1,
      },
    },
  })

  return assets.map((asset) => ({
    ...asset,
    purchasePrice: asset.purchasePrice.toNumber(),
    residualValue: asset.residualValue.toNumber(),
    bookValue: asset.bookValue.toNumber(),
    disposalPrice: asset.disposalPrice?.toNumber() ?? null,
  }))
}

// Get a single asset by ID
export async function getAsset(id: string) {
  const userId = await getCurrentUserId()

  const asset = await db.asset.findFirst({
    where: { id, userId },
    include: {
      depreciationEntries: {
        orderBy: { year: "asc" },
      },
    },
  })

  if (!asset) {
    return null
  }

  return {
    ...asset,
    purchasePrice: asset.purchasePrice.toNumber(),
    residualValue: asset.residualValue.toNumber(),
    bookValue: asset.bookValue.toNumber(),
    disposalPrice: asset.disposalPrice?.toNumber() ?? null,
    depreciationEntries: asset.depreciationEntries.map((entry) => ({
      ...entry,
      amount: entry.amount.toNumber(),
      bookValueStart: entry.bookValueStart.toNumber(),
      bookValueEnd: entry.bookValueEnd.toNumber(),
    })),
  }
}

// Create a new asset
export async function createAsset(data: AssetFormData) {
  const validated = assetSchema.parse(data)
  const userId = await getCurrentUserId()

  // Calculate initial book value (same as purchase price)
  const bookValue = calculateCurrentBookValue(
    {
      purchasePrice: validated.purchasePrice,
      residualValue: validated.residualValue,
      usefulLifeYears: validated.usefulLifeYears,
      purchaseDate: validated.purchaseDate,
      depreciationMethod: validated.depreciationMethod,
    },
    new Date()
  )

  // Create the asset
  const asset = await db.asset.create({
    data: {
      userId,
      name: validated.name,
      description: validated.description,
      category: validated.category,
      purchaseDate: validated.purchaseDate,
      purchasePrice: validated.purchasePrice,
      supplier: validated.supplier,
      usefulLifeYears: validated.usefulLifeYears,
      residualValue: validated.residualValue,
      depreciationMethod: validated.depreciationMethod,
      bookValue,
      isActive: true,
    },
  })

  // Generate depreciation schedule
  const schedule = generateDepreciationSchedule({
    purchasePrice: validated.purchasePrice,
    residualValue: validated.residualValue,
    usefulLifeYears: validated.usefulLifeYears,
    purchaseDate: validated.purchaseDate,
    depreciationMethod: validated.depreciationMethod,
  })

  // Create depreciation entries
  if (schedule.length > 0) {
    await db.depreciationEntry.createMany({
      data: schedule.map((entry) => ({
        assetId: asset.id,
        year: entry.year,
        amount: entry.amount,
        bookValueStart: entry.bookValueStart,
        bookValueEnd: entry.bookValueEnd,
      })),
    })
  }

  revalidatePath("/activa")
  return asset
}

// Update an existing asset
export async function updateAsset(id: string, data: AssetFormData) {
  const validated = assetSchema.parse(data)
  const userId = await getCurrentUserId()

  // Verify ownership
  const existing = await db.asset.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error("Activum niet gevonden")
  }

  // Recalculate book value
  const bookValue = calculateCurrentBookValue(
    {
      purchasePrice: validated.purchasePrice,
      residualValue: validated.residualValue,
      usefulLifeYears: validated.usefulLifeYears,
      purchaseDate: validated.purchaseDate,
      depreciationMethod: validated.depreciationMethod,
    },
    new Date()
  )

  // Update the asset
  const asset = await db.asset.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description,
      category: validated.category,
      purchaseDate: validated.purchaseDate,
      purchasePrice: validated.purchasePrice,
      supplier: validated.supplier,
      usefulLifeYears: validated.usefulLifeYears,
      residualValue: validated.residualValue,
      depreciationMethod: validated.depreciationMethod,
      bookValue,
    },
  })

  // Regenerate depreciation schedule
  await db.depreciationEntry.deleteMany({
    where: { assetId: id },
  })

  const schedule = generateDepreciationSchedule({
    purchasePrice: validated.purchasePrice,
    residualValue: validated.residualValue,
    usefulLifeYears: validated.usefulLifeYears,
    purchaseDate: validated.purchaseDate,
    depreciationMethod: validated.depreciationMethod,
  })

  if (schedule.length > 0) {
    await db.depreciationEntry.createMany({
      data: schedule.map((entry) => ({
        assetId: asset.id,
        year: entry.year,
        amount: entry.amount,
        bookValueStart: entry.bookValueStart,
        bookValueEnd: entry.bookValueEnd,
      })),
    })
  }

  revalidatePath("/activa")
  revalidatePath(`/activa/${id}`)
  return asset
}

// Delete an asset
export async function deleteAsset(id: string) {
  const userId = await getCurrentUserId()

  // Verify ownership
  const existing = await db.asset.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error("Activum niet gevonden")
  }

  // Delete the asset (depreciation entries will cascade)
  await db.asset.delete({
    where: { id },
  })

  revalidatePath("/activa")
}

// Dispose of an asset (sell or write off)
export async function disposeAsset(
  id: string,
  data: { disposalDate: Date; disposalPrice: number }
) {
  const userId = await getCurrentUserId()

  // Verify ownership
  const existing = await db.asset.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw new Error("Activum niet gevonden")
  }

  await db.asset.update({
    where: { id },
    data: {
      isActive: false,
      disposalDate: data.disposalDate,
      disposalPrice: data.disposalPrice,
    },
  })

  revalidatePath("/activa")
  revalidatePath(`/activa/${id}`)
}

// Get summary statistics
export async function getAssetsSummary() {
  const userId = await getCurrentUserId()

  const assets = await db.asset.findMany({
    where: { userId, isActive: true },
    select: {
      purchasePrice: true,
      bookValue: true,
      category: true,
    },
  })

  const totalPurchasePrice = assets.reduce(
    (sum, a) => sum + a.purchasePrice.toNumber(),
    0
  )
  const totalBookValue = assets.reduce(
    (sum, a) => sum + a.bookValue.toNumber(),
    0
  )
  const totalDepreciation = totalPurchasePrice - totalBookValue

  // Group by category
  const byCategory: Record<string, { count: number; bookValue: number }> = {}
  for (const asset of assets) {
    if (!byCategory[asset.category]) {
      byCategory[asset.category] = { count: 0, bookValue: 0 }
    }
    const cat = byCategory[asset.category]!
    cat.count++
    cat.bookValue += asset.bookValue.toNumber()
  }

  return {
    totalAssets: assets.length,
    totalPurchasePrice,
    totalBookValue,
    totalDepreciation,
    byCategory,
  }
}
