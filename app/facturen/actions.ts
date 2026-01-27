"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations"
import { generateInvoiceNumber, roundToTwo } from "@/lib/utils"
import { getCurrentUserId } from "@/lib/server-utils"
import { logCreate, logUpdate, logDelete, logPaymentRecorded } from "@/lib/audit/helpers"
import { requireCompanyDetails } from "@/lib/company-guard"

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
  
  // Convert Decimal fields to numbers for serialization
  return invoices.map((invoice) => ({
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
    })),
  }))
}

export async function getInvoice(id: string) {
  const userId = await getCurrentUserId()
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: "asc" },
      },
      user: { include: { company: true } },
      emails: {
        orderBy: { createdAt: "desc" },
      },
    },
  })
  
  // Verify invoice belongs to user
  if (!invoice || invoice.userId !== userId) {
    return null
  }
  
  // Convert Decimal fields to numbers for serialization
  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
    })),
  }
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
  await requireCompanyDetails()
  const validated = invoiceSchema.parse(data)
  const userId = await getCurrentUserId()

  // Check if user can create invoice
  const { canCreateInvoice, incrementInvoiceCount } = await import('@/lib/stripe/subscriptions')
  const canCreate = await canCreateInvoice(userId)

  if (!canCreate.allowed) {
    throw new Error(
      canCreate.reason || 'Je hebt je maandelijkse limiet bereikt. Upgrade naar Pro voor onbeperkt facturen.'
    )
  }

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

  // Increment counter for free users
  await incrementInvoiceCount(userId)

  // Log audit trail
  await logCreate("invoice", invoice.id, {
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    total: invoice.total.toNumber(),
    status: invoice.status,
  }, userId)

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

  // Get current invoice to check status change and for audit logging
  const currentInvoice = await db.invoice.findUnique({
    where: { id },
    include: {
      items: true,
    },
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

  // Log audit trail
  if (currentInvoice) {
    await logUpdate(
      "invoice",
      id,
      {
        customerId: currentInvoice.customerId,
        invoiceDate: currentInvoice.invoiceDate,
        dueDate: currentInvoice.dueDate,
        status: currentInvoice.status,
        subtotal: currentInvoice.subtotal.toNumber(),
        vatAmount: currentInvoice.vatAmount.toNumber(),
        total: currentInvoice.total.toNumber(),
        reference: currentInvoice.reference,
        notes: currentInvoice.notes,
        internalNotes: currentInvoice.internalNotes,
      },
      {
        customerId: invoice.customerId,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        subtotal: invoice.subtotal.toNumber(),
        vatAmount: invoice.vatAmount.toNumber(),
        total: invoice.total.toNumber(),
        reference: invoice.reference,
        notes: invoice.notes,
        internalNotes: invoice.internalNotes,
      },
      userId
    )
  }

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
  
  // Get current invoice for audit logging
  const currentInvoice = await db.invoice.findUnique({
    where: { id },
    select: { userId: true, status: true, total: true },
  })
  
  if (!currentInvoice || currentInvoice.userId !== userId) {
    throw new Error("Factuur niet gevonden")
  }
  
  const invoice = await db.invoice.update({
    where: { id },
    data: updateData,
  })

  // Log audit trail for status change
  if (currentInvoice) {
    await logUpdate(
      "invoice",
      id,
      { status: currentInvoice.status },
      { status: invoice.status },
      userId
    )
    
    // Log payment if status changed to PAID
    if (status === "PAID" && currentInvoice.status !== "PAID") {
      await logPaymentRecorded(id, currentInvoice.total.toNumber(), userId)
    }
  }

  revalidatePath("/facturen")
  revalidatePath(`/facturen/${id}`)
  revalidatePath("/")
  
  // Convert Decimal fields to numbers for serialization
  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
  }
}

export async function deleteInvoice(id: string) {
  const userId = await getCurrentUserId()
  
  // Get invoice data before deletion for audit logging
  const invoice = await db.invoice.findUnique({
    where: { id },
    select: {
      userId: true,
      invoiceNumber: true,
      customerId: true,
      total: true,
      status: true,
    },
  })
  
  if (!invoice || invoice.userId !== userId) {
    throw new Error("Factuur niet gevonden")
  }
  
  await db.invoice.delete({
    where: { id, userId },
  })

  // Log audit trail
  if (invoice) {
    await logDelete(
      "invoice",
      id,
      {
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        total: invoice.total.toNumber(),
        status: invoice.status,
      },
      userId
    )
  }

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
  
  // Convert Decimal fields to numbers for serialization
  return invoices.map((invoice) => ({
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
  }))
}

// ========== Payment Link Actions ==========
export async function generatePaymentLink(invoiceId: string) {
  const userId = await getCurrentUserId()

  // Verify invoice belongs to user
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        select: { mollieEnabled: true },
      },
    },
  })

  if (!invoice || invoice.userId !== userId) {
    throw new Error("Factuur niet gevonden")
  }

  if (!invoice.user.mollieEnabled) {
    throw new Error("Mollie betalingen zijn niet ingeschakeld")
  }

  if (invoice.status === "PAID") {
    throw new Error("Deze factuur is al betaald")
  }

  if (invoice.status === "CANCELLED") {
    throw new Error("Deze factuur is geannuleerd")
  }

  // Generate payment link
  const { createPaymentLink } = await import("@/lib/mollie/payments")
  const result = await createPaymentLink(invoiceId)

  revalidatePath(`/facturen/${invoiceId}`)
  return result
}

export async function getInvoicePaymentInfo(invoiceId: string) {
  const userId = await getCurrentUserId()

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        select: {
          mollieEnabled: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          mollieStatus: true,
          amount: true,
          method: true,
          paidAt: true,
          createdAt: true,
          consumerName: true,
        },
      },
    },
  })

  if (!invoice || invoice.userId !== userId) {
    return null
  }

  return {
    paymentLinkToken: invoice.paymentLinkToken,
    paymentLinkExpiresAt: invoice.paymentLinkExpiresAt,
    mollieEnabled: invoice.user.mollieEnabled,
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toNumber(),
    })),
  }
}

export async function getRecentPayments(limit = 5) {
  const userId = await getCurrentUserId()

  const payments = await db.payment.findMany({
    where: {
      invoice: {
        userId,
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          customer: {
            select: {
              name: true,
              companyName: true,
            },
          },
        },
      },
    },
  })

  return payments
}
