"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { customerSchema, type CustomerFormData } from "@/lib/validations"
import { TEMP_USER_ID, getOrCreateTempUser } from "@/lib/server-utils"

export async function getCustomers() {
  const customers = await db.customer.findMany({
    where: { userId: TEMP_USER_ID },
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
  const customer = await db.customer.findUnique({
    where: { id, userId: TEMP_USER_ID },
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

  // Zorg dat de temp user bestaat
  await getOrCreateTempUser()

  const customer = await db.customer.create({
    data: {
      ...validated,
      userId: TEMP_USER_ID,
    },
  })

  revalidatePath("/klanten")
  return customer
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const validated = customerSchema.parse(data)

  const customer = await db.customer.update({
    where: { id, userId: TEMP_USER_ID },
    data: validated,
  })

  revalidatePath("/klanten")
  revalidatePath(`/klanten/${id}`)
  return customer
}

export async function deleteCustomer(id: string) {
  await db.customer.delete({
    where: { id, userId: TEMP_USER_ID },
  })

  revalidatePath("/klanten")
}
