"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { customerSchema, type CustomerFormData } from "@/lib/validations"
import { getCurrentUserId } from "@/lib/server-utils"
import { logCreate, logUpdate, logDelete } from "@/lib/audit/helpers"
import { requireCompanyDetails } from "@/lib/company-guard"

interface GetCustomersOptions {
  search?: string
  sortBy?: "name" | "companyName" | "email" | "city" | "invoiceCount"
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export async function getCustomers(options: GetCustomersOptions = {}) {
  const userId = await getCurrentUserId()
  const {
    search,
    sortBy = "name",
    sortOrder = "desc",
    page = 1,
    pageSize = 50,
  } = options

  const where: Prisma.CustomerWhereInput = { userId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ]
  }

  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    sortBy === "invoiceCount"
      ? { invoices: { _count: sortOrder } }
      : { [sortBy]: sortOrder }

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { invoices: true } },
      },
    }),
    db.customer.count({ where }),
  ])

  return { customers, total }
}

/**
 * Lightweight customer list for use in form dropdowns.
 * Only fetches the fields needed to render a select input.
 */
export async function getCustomersForDropdown() {
  const userId = await getCurrentUserId()
  return db.customer.findMany({
    where: { userId },
    select: { id: true, name: true, companyName: true, paymentTermDays: true },
    orderBy: { name: "asc" },
  })
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
  await requireCompanyDetails()
  const validated = customerSchema.parse(data)
  const userId = await getCurrentUserId()

  const customer = await db.customer.create({
    data: {
      ...validated,
      userId,
    },
  })

  // Log audit trail
  await logCreate("customer", customer.id, {
    name: customer.name,
    email: customer.email,
    companyName: customer.companyName,
  }, userId)

  revalidatePath("/klanten")
  return customer
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const validated = customerSchema.parse(data)
  const userId = await getCurrentUserId()

  // Get current customer for audit logging
  const currentCustomer = await db.customer.findUnique({
    where: { id, userId },
  })

  const customer = await db.customer.update({
    where: { id, userId },
    data: validated,
  })

  // Log audit trail
  if (currentCustomer) {
    await logUpdate(
      "customer",
      id,
      {
        name: currentCustomer.name,
        email: currentCustomer.email,
        companyName: currentCustomer.companyName,
        phone: currentCustomer.phone,
        address: currentCustomer.address,
        city: currentCustomer.city,
        postalCode: currentCustomer.postalCode,
        vatNumber: currentCustomer.vatNumber,
      },
      {
        name: customer.name,
        email: customer.email,
        companyName: customer.companyName,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        vatNumber: customer.vatNumber,
      },
      userId
    )
  }

  revalidatePath("/klanten")
  revalidatePath(`/klanten/${id}`)
  return customer
}

export async function deleteCustomer(id: string) {
  const userId = await getCurrentUserId()
  
  // Get customer data before deletion for audit logging
  const customer = await db.customer.findUnique({
    where: { id, userId },
    select: {
      name: true,
      email: true,
      companyName: true,
    },
  })
  
  await db.customer.delete({
    where: { id, userId },
  })

  // Log audit trail
  if (customer) {
    await logDelete(
      "customer",
      id,
      {
        name: customer.name,
        email: customer.email,
        companyName: customer.companyName,
      },
      userId
    )
  }

  revalidatePath("/klanten")
}
