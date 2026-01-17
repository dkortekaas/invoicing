"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { productSchema, type ProductFormData } from "@/lib/validations"
import { getCurrentUserId } from "@/lib/server-utils"

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

  revalidatePath("/producten")
  return product
}

export async function updateProduct(id: string, data: ProductFormData) {
  const validated = productSchema.parse(data)
  const userId = await getCurrentUserId()

  const product = await db.product.update({
    where: { id, userId },
    data: {
      ...validated,
      unitPrice: validated.unitPrice,
      vatRate: validated.vatRate,
    },
  })

  revalidatePath("/producten")
  return product
}

export async function deleteProduct(id: string) {
  const userId = await getCurrentUserId()
  await db.product.delete({
    where: { id, userId },
  })

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
