"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations"
import { generateInvoiceNumber, roundToTwo } from "@/lib/utils"
import { getCurrentUserId } from "@/lib/server-utils"

export async function getInvoices(status?: string) {
  const userId = await getCurrentUserId()
  const where: Record<string, unknown> = { userId }
  if (status && status !== "ALL") {
    where.status = status
  }

  const invoices = await db.invoice.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    include: {
      customer: true,
      items: true,
    },
  })
  return invoices
}

export async function getInvoice(id: string) {
  const userId = await getCurrentUserId()
  const invoice = await db.invoice.findUnique({
    where: { id, userId },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: "asc" },
      },
      user: true,
      emails: {
        orderBy: { createdAt: "desc" },
      },
    },
  })
  return invoice
}

export async function getNextInvoiceNumber() {
  const userId = await getCurrentUserId()
  const year = new Date().getFullYear()
  const prefix = `${year}-`

  const lastInvoice = await db.invoice.findFirst({
    where: {
      userId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { invoiceNumber: "desc" },
  })

  let sequence = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-")
    const lastNumber = parts[1] ? parseInt(parts[1]) : 0
    sequence = lastNumber + 1
  }

  return generateInvoiceNumber(year, sequence)
}

export async function createInvoice(
  data: InvoiceFormData,
  status: "DRAFT" | "SENT" = "DRAFT"
) {
  const validated = invoiceSchema.parse(data)
  const userId = await getCurrentUserId()

  // Bereken totalen
  let subtotal = 0
  let vatAmount = 0
  let total = 0

  const itemsWithTotals = validated.items.map((item: typeof validated.items[0], index: number) => {
    const itemSubtotal = roundToTwo(item.quantity * item.unitPrice)
    const itemVatAmount = roundToTwo(itemSubtotal * (item.vatRate / 100))
    const itemTotal = roundToTwo(itemSubtotal + itemVatAmount)

    subtotal += itemSubtotal
    vatAmount += itemVatAmount
    total += itemTotal

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      unit: item.unit,
      subtotal: itemSubtotal,
      vatAmount: itemVatAmount,
      total: itemTotal,
      sortOrder: index,
    }
  })

  const invoiceNumber = await getNextInvoiceNumber()

  const invoice = await db.invoice.create({
    data: {
      userId,
      invoiceNumber,
      customerId: validated.customerId,
      invoiceDate: validated.invoiceDate,
      dueDate: validated.dueDate,
      status,
      subtotal: roundToTwo(subtotal),
      vatAmount: roundToTwo(vatAmount),
      total: roundToTwo(total),
      reference: validated.reference,
      notes: validated.notes,
      internalNotes: validated.internalNotes,
      sentAt: status === "SENT" ? new Date() : null,
      items: {
        create: itemsWithTotals,
      },
    },
    include: {
      items: true,
    },
  })

  revalidatePath("/facturen")
  revalidatePath("/")
  return invoice
}

export async function updateInvoice(
  id: string,
  data: InvoiceFormData,
  status?: "DRAFT" | "SENT"
) {
  const userId = await getCurrentUserId()
  const validated = invoiceSchema.parse(data)

  // Bereken totalen
  let subtotal = 0
  let vatAmount = 0
  let total = 0

  const itemsWithTotals = validated.items.map((item: typeof validated.items[0], index: number) => {
    const itemSubtotal = roundToTwo(item.quantity * item.unitPrice)
    const itemVatAmount = roundToTwo(itemSubtotal * (item.vatRate / 100))
    const itemTotal = roundToTwo(itemSubtotal + itemVatAmount)

    subtotal += itemSubtotal
    vatAmount += itemVatAmount
    total += itemTotal

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      unit: item.unit,
      subtotal: itemSubtotal,
      vatAmount: itemVatAmount,
      total: itemTotal,
      sortOrder: index,
    }
  })

  // Verwijder bestaande items
  await db.invoiceItem.deleteMany({
    where: { invoiceId: id },
  })

  // Get current invoice to check status change
  const currentInvoice = await db.invoice.findUnique({
    where: { id },
    select: { status: true, sentAt: true },
  })

  const updateData: Record<string, unknown> = {
    customerId: validated.customerId,
    invoiceDate: validated.invoiceDate,
    dueDate: validated.dueDate,
    subtotal: roundToTwo(subtotal),
    vatAmount: roundToTwo(vatAmount),
    total: roundToTwo(total),
    reference: validated.reference,
    notes: validated.notes,
    internalNotes: validated.internalNotes,
    items: {
      create: itemsWithTotals,
    },
  }

  if (status) {
    updateData.status = status
    if (status === "SENT" && !currentInvoice?.sentAt) {
      updateData.sentAt = new Date()
    }
  }

  const invoice = await db.invoice.update({
    where: { id, userId },
    data: updateData,
    include: {
      items: true,
    },
  })

  revalidatePath("/facturen")
  revalidatePath(`/facturen/${id}`)
  revalidatePath("/")
  return invoice
}

export async function updateInvoiceStatus(
  id: string,
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
) {
  const updateData: Record<string, unknown> = { status }

  if (status === "SENT") {
    updateData.sentAt = new Date()
  } else if (status === "PAID") {
    updateData.paidAt = new Date()
  }

  const userId = await getCurrentUserId()
  const invoice = await db.invoice.update({
    where: { id, userId },
    data: updateData,
  })

  revalidatePath("/facturen")
  revalidatePath(`/facturen/${id}`)
  revalidatePath("/")
  return invoice
}

export async function deleteInvoice(id: string) {
  const userId = await getCurrentUserId()
  await db.invoice.delete({
    where: { id, userId },
  })

  revalidatePath("/facturen")
  revalidatePath("/")
}

export async function getDashboardStats() {
  const userId = await getCurrentUserId()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    openInvoices,
    overdueInvoices,
    revenueThisMonth,
    revenueThisYear,
    customerCount,
  ] = await Promise.all([
    // Openstaande facturen (SENT + OVERDUE)
    db.invoice.aggregate({
      where: {
        userId,
        status: { in: ["SENT", "OVERDUE"] },
      },
      _sum: { total: true },
      _count: true,
    }),

    // Achterstallige facturen
    db.invoice.aggregate({
      where: {
        userId,
        status: "OVERDUE",
      },
      _sum: { total: true },
      _count: true,
    }),

    // Omzet deze maand
    db.invoice.aggregate({
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),

    // Omzet dit jaar
    db.invoice.aggregate({
      where: {
        userId,
        status: "PAID",
        paidAt: { gte: startOfYear },
      },
      _sum: { total: true },
    }),

    // Aantal klanten
    db.customer.count({
      where: { userId },
    }),
  ])

  return {
    totalOutstanding: openInvoices._sum.total?.toNumber() ?? 0,
    invoiceCount: openInvoices._count,
    overdueCount: overdueInvoices._count,
    overdueAmount: overdueInvoices._sum.total?.toNumber() ?? 0,
    revenueThisMonth: revenueThisMonth._sum.total?.toNumber() ?? 0,
    revenueThisYear: revenueThisYear._sum.total?.toNumber() ?? 0,
    customerCount,
  }
}

export async function getRecentInvoices(limit = 5) {
  const userId = await getCurrentUserId()
  const invoices = await db.invoice.findMany({
    where: { userId },
    orderBy: { invoiceDate: "desc" },
    take: limit,
    include: {
      customer: {
        select: { name: true, companyName: true },
      },
    },
  })
  return invoices
}
