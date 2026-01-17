"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { productSchema, type ProductFormData } from "@/lib/validations"
import { TEMP_USER_ID, getOrCreateTempUser } from "@/lib/server-utils"

export async function getProducts() {
  const products = await db.product.findMany({
    where: { userId: TEMP_USER_ID },
    orderBy: { name: "asc" },
  })
  return products
}

export async function getActiveProducts() {
  const products = await db.product.findMany({
    where: { userId: TEMP_USER_ID, isActive: true },
    orderBy: { name: "asc" },
  })
  return products
}

export async function getProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id, userId: TEMP_USER_ID },
  })
  return product
}

export async function createProduct(data: ProductFormData) {
  const validated = productSchema.parse(data)

  // Zorg dat de temp user bestaat
  await getOrCreateTempUser()

  const product = await db.product.create({
    data: {
      ...validated,
      unitPrice: validated.unitPrice,
      vatRate: validated.vatRate,
      userId: TEMP_USER_ID,
    },
  })

  revalidatePath("/producten")
  return product
}

export async function updateProduct(id: string, data: ProductFormData) {
  const validated = productSchema.parse(data)

  const product = await db.product.update({
    where: { id, userId: TEMP_USER_ID },
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
  await db.product.delete({
    where: { id, userId: TEMP_USER_ID },
  })

  revalidatePath("/producten")
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const product = await db.product.update({
    where: { id, userId: TEMP_USER_ID },
    data: { isActive },
  })

  revalidatePath("/producten")
  return product
}
