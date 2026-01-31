"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { vendorSchema, type VendorFormData } from "@/lib/validations"
import { getCurrentUserId } from "@/lib/server-utils"
import { normalizeVendorName } from "@/lib/categorization"

export async function getVendors() {
  const userId = await getCurrentUserId()
  const vendors = await db.vendor.findMany({
    where: {
      OR: [
        { userId },
        { userId: null }, // Include global vendors
      ],
    },
    orderBy: [
      { userId: 'desc' }, // User vendors first
      { useCount: 'desc' },
    ],
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  })
  return vendors
}

export async function getUserVendors() {
  const userId = await getCurrentUserId()
  const vendors = await db.vendor.findMany({
    where: { userId },
    orderBy: { useCount: 'desc' },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
  })
  return vendors
}

export async function getVendor(id: string) {
  const userId = await getCurrentUserId()
  const vendor = await db.vendor.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { userId: null },
      ],
    },
    include: {
      expenses: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  })
  return vendor
}

export async function createVendor(data: VendorFormData) {
  const validated = vendorSchema.parse(data)
  const userId = await getCurrentUserId()

  const normalizedName = normalizeVendorName(validated.name)

  // Check if vendor with same normalized name already exists for this user
  const existing = await db.vendor.findFirst({
    where: {
      userId,
      normalizedName,
    },
  })

  if (existing) {
    throw new Error('Een leverancier met deze naam bestaat al')
  }

  const vendor = await db.vendor.create({
    data: {
      userId,
      name: validated.name.trim(),
      normalizedName,
      aliases: validated.aliases || [],
      defaultCategory: validated.defaultCategory,
      website: validated.website || null,
      vatNumber: validated.vatNumber || null,
    },
  })

  revalidatePath("/leveranciers")
  return vendor
}

export async function updateVendor(id: string, data: VendorFormData) {
  const validated = vendorSchema.parse(data)
  const userId = await getCurrentUserId()

  // Verify ownership
  const existing = await db.vendor.findFirst({
    where: {
      id,
      userId, // Can only edit own vendors, not global ones
    },
  })

  if (!existing) {
    throw new Error('Leverancier niet gevonden of geen toegang')
  }

  const normalizedName = normalizeVendorName(validated.name)

  // Check if another vendor with same normalized name exists
  const duplicate = await db.vendor.findFirst({
    where: {
      userId,
      normalizedName,
      NOT: { id },
    },
  })

  if (duplicate) {
    throw new Error('Een leverancier met deze naam bestaat al')
  }

  const vendor = await db.vendor.update({
    where: { id },
    data: {
      name: validated.name.trim(),
      normalizedName,
      aliases: validated.aliases || [],
      defaultCategory: validated.defaultCategory,
      website: validated.website || null,
      vatNumber: validated.vatNumber || null,
    },
  })

  revalidatePath("/leveranciers")
  revalidatePath(`/leveranciers/${id}`)
  return vendor
}

export async function deleteVendor(id: string) {
  const userId = await getCurrentUserId()

  // Verify ownership (can only delete own vendors)
  const vendor = await db.vendor.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!vendor) {
    throw new Error('Leverancier niet gevonden of geen toegang')
  }

  // Remove vendor reference from expenses, but keep the expenses
  await db.expense.updateMany({
    where: { vendorId: id },
    data: { vendorId: null },
  })

  await db.vendor.delete({
    where: { id },
  })

  revalidatePath("/leveranciers")
}

export async function searchVendors(query: string) {
  if (!query || query.length < 2) return []

  const userId = await getCurrentUserId()
  const normalized = normalizeVendorName(query)

  const vendors = await db.vendor.findMany({
    where: {
      OR: [
        { userId },
        { userId: null },
      ],
      AND: {
        OR: [
          { normalizedName: { contains: normalized } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
    },
    orderBy: [
      { userId: 'desc' },
      { useCount: 'desc' },
    ],
    take: 10,
  })

  return vendors
}

export async function addVendorAlias(id: string, alias: string) {
  const userId = await getCurrentUserId()

  const vendor = await db.vendor.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!vendor) {
    throw new Error('Leverancier niet gevonden of geen toegang')
  }

  const trimmedAlias = alias.trim()
  if (!trimmedAlias) {
    throw new Error('Alias mag niet leeg zijn')
  }

  if (vendor.aliases.includes(trimmedAlias)) {
    throw new Error('Deze alias bestaat al')
  }

  const updatedVendor = await db.vendor.update({
    where: { id },
    data: {
      aliases: [...vendor.aliases, trimmedAlias],
    },
  })

  revalidatePath("/leveranciers")
  return updatedVendor
}

export async function removeVendorAlias(id: string, alias: string) {
  const userId = await getCurrentUserId()

  const vendor = await db.vendor.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!vendor) {
    throw new Error('Leverancier niet gevonden of geen toegang')
  }

  const updatedVendor = await db.vendor.update({
    where: { id },
    data: {
      aliases: vendor.aliases.filter(a => a !== alias),
    },
  })

  revalidatePath("/leveranciers")
  return updatedVendor
}
