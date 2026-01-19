"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { productSchema, type ProductFormData } from "@/lib/validations"
import { getCurrentUserId } from "@/lib/server-utils"
import { logCreate, logUpdate, logDelete } from "@/lib/audit/helpers"

export async function getProducts() {
  const userId = await getCurrentUserId()
  const products = await db.product.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  })
  return products
}

export async function getActiveProducts() {
  const userId = await getCurrentUserId()
  const products = await db.product.findMany({
    where: { userId, isActive: true },
    orderBy: { name: "asc" },
  })
  return products
}

export async function getProduct(id: string) {
  const userId = await getCurrentUserId()
  const product = await db.product.findUnique({
    where: { id, userId },
  })
  return product
}

export async function createProduct(data: ProductFormData) {
  const validated = productSchema.parse(data)
  const userId = await getCurrentUserId()

  const product = await db.product.create({
    data: {
      ...validated,
      unitPrice: validated.unitPrice,
      vatRate: validated.vatRate,
      userId,
    },
  })

  // Log audit trail
  await logCreate("product", product.id, {
    name: product.name,
    unitPrice: product.unitPrice.toNumber(),
    vatRate: product.vatRate.toNumber(),
    isActive: product.isActive,
  }, userId)

  revalidatePath("/producten")
  return product
}

export async function updateProduct(id: string, data: ProductFormData) {
  const validated = productSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current product for audit logging
  const currentProduct = await db.product.findUnique({
    where: { id, userId },
  })

  const product = await db.product.update({
    where: { id, userId },
    data: {
      ...validated,
      unitPrice: validated.unitPrice,
      vatRate: validated.vatRate,
    },
  })

  // Log audit trail
  if (currentProduct) {
    await logUpdate(
      "product",
      id,
      {
        name: currentProduct.name,
        unitPrice: currentProduct.unitPrice.toNumber(),
        vatRate: currentProduct.vatRate.toNumber(),
        isActive: currentProduct.isActive,
      },
      {
        name: product.name,
        unitPrice: product.unitPrice.toNumber(),
        vatRate: product.vatRate.toNumber(),
        isActive: product.isActive,
      },
      userId
    )
  }

  revalidatePath("/producten")
  return product
}

export async function deleteProduct(id: string) {
  const userId = await getCurrentUserId()
  
  // Get product data before deletion for audit logging
  const product = await db.product.findUnique({
    where: { id, userId },
    select: {
      name: true,
      unitPrice: true,
      vatRate: true,
    },
  })
  
  await db.product.delete({
    where: { id, userId },
  })

  // Log audit trail
  if (product) {
    await logDelete(
      "product",
      id,
      {
        name: product.name,
        unitPrice: product.unitPrice.toNumber(),
        vatRate: product.vatRate.toNumber(),
      },
      userId
    )
  }

  revalidatePath("/producten")
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const userId = await getCurrentUserId()
  const product = await db.product.update({
    where: { id, userId },
    data: { isActive },
  })

  revalidatePath("/producten")
  return product
}
