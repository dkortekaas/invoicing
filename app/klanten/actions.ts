"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { customerSchema, type CustomerFormData } from "@/lib/validations"
import { getCurrentUserId } from "@/lib/server-utils"

export async function getCustomers() {
  const userId = await getCurrentUserId()
  const customers = await db.customer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { invoices: true },
      },
    },
  })
  return customers
}

export async function getCustomer(id: string) {
  const userId = await getCurrentUserId()
  const customer = await db.customer.findUnique({
    where: { id, userId },
    include: {
      invoices: {
        orderBy: { invoiceDate: "desc" },
        take: 10,
      },
    },
  })
  return customer
}

export async function createCustomer(data: CustomerFormData) {
  const validated = customerSchema.parse(data)
  const userId = await getCurrentUserId()

  const customer = await db.customer.create({
    data: {
      ...validated,
      userId,
    },
  })

  revalidatePath("/klanten")
  return customer
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const validated = customerSchema.parse(data)
  const userId = await getCurrentUserId()

  const customer = await db.customer.update({
    where: { id, userId },
    data: validated,
  })

  revalidatePath("/klanten")
  revalidatePath(`/klanten/${id}`)
  return customer
}

export async function deleteCustomer(id: string) {
  const userId = await getCurrentUserId()
  await db.customer.delete({
    where: { id, userId },
  })

  revalidatePath("/klanten")
}
