"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { creditNoteSchema, type CreditNoteFormData } from "@/lib/validations"
import { generateCreditNoteNumber, roundToTwo } from "@/lib/utils"
import { getCurrentUserId } from "@/lib/server-utils"
import { logCreate, logUpdate, logDelete } from "@/lib/audit/helpers"
import type { CreditNoteStatus, CreditNoteReason } from "@prisma/client"

export async function getCreditNotes(status?: string) {
  const userId = await getCurrentUserId()
  const where: Record<string, unknown> = { userId }
  if (status && status !== "ALL") {
    where.status = status
  }

  const creditNotes = await db.creditNote.findMany({
    where,
    orderBy: { creditNoteDate: "desc" },
    include: {
      customer: true,
      items: true,
      originalInvoice: {
        select: {
          id: true,
          invoiceNumber: true,
        },
      },
    },
  })
  return creditNotes.map((cn) => ({
    ...cn,
    subtotal: cn.subtotal.toNumber(),
    vatAmount: cn.vatAmount.toNumber(),
    total: cn.total.toNumber(),
    items: cn.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
      total: item.total.toNumber(),
    })),
  }))
}

export async function getCreditNote(id: string) {
  const userId = await getCurrentUserId()
  const creditNote = await db.creditNote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: "asc" },
      },
      user: true,
      emails: {
        orderBy: { createdAt: "desc" },
      },
      originalInvoice: {
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
        },
      },
    },
  })

  // Verify credit note belongs to user
  if (!creditNote || creditNote.userId !== userId) {
    return null
  }

  // Convert Decimal fields to numbers for serialization
  return {
    ...creditNote,
    subtotal: creditNote.subtotal.toNumber(),
    vatAmount: creditNote.vatAmount.toNumber(),
    total: creditNote.total.toNumber(),
    items: creditNote.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
      total: item.total.toNumber(),
    })),
    originalInvoice: creditNote.originalInvoice
      ? {
          ...creditNote.originalInvoice,
          total: creditNote.originalInvoice.total.toNumber(),
        }
      : null,
  }
}

export async function getNextCreditNoteNumber() {
  const userId = await getCurrentUserId()
  const year = new Date().getFullYear()
  const prefix = `CN-${year}-`

  const lastCreditNote = await db.creditNote.findFirst({
    where: {
      userId,
      creditNoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { creditNoteNumber: "desc" },
  })

  let sequence = 1
  if (lastCreditNote) {
    const parts = lastCreditNote.creditNoteNumber.split("-")
    const lastNumber = parts[2] ? parseInt(parts[2]) : 0
    sequence = lastNumber + 1
  }

  return generateCreditNoteNumber(year, sequence)
}

export async function createCreditNote(
  data: CreditNoteFormData,
  status: "DRAFT" | "FINAL" = "DRAFT"
) {
  const validated = creditNoteSchema.parse(data)
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
      originalInvoiceItemId: item.originalInvoiceItemId || null,
    }
  })

  const creditNoteNumber = await getNextCreditNoteNumber()

  const creditNote = await db.creditNote.create({
    data: {
      userId,
      creditNoteNumber,
      customerId: validated.customerId,
      creditNoteDate: validated.creditNoteDate,
      status,
      reason: validated.reason as CreditNoteReason,
      originalInvoiceId: validated.originalInvoiceId || null,
      originalInvoiceNumber: validated.originalInvoiceNumber || null,
      subtotal: roundToTwo(subtotal),
      vatAmount: roundToTwo(vatAmount),
      total: roundToTwo(total),
      description: validated.description,
      notes: validated.notes,
      internalNotes: validated.internalNotes,
      finalizedAt: status === "FINAL" ? new Date() : null,
      items: {
        create: itemsWithTotals,
      },
    },
    include: {
      items: true,
    },
  })

  // Log audit trail
  await logCreate("creditNote", creditNote.id, {
    creditNoteNumber: creditNote.creditNoteNumber,
    customerId: creditNote.customerId,
    total: creditNote.total.toNumber(),
    status: creditNote.status,
    reason: creditNote.reason,
    originalInvoiceId: creditNote.originalInvoiceId,
  }, userId)

  revalidatePath("/creditnotas")
  revalidatePath("/")
  return creditNote
}

export async function updateCreditNote(
  id: string,
  data: CreditNoteFormData,
  status?: "DRAFT" | "FINAL"
) {
  const userId = await getCurrentUserId()
  const validated = creditNoteSchema.parse(data)

  // Check if credit note exists and is editable
  const existing = await db.creditNote.findUnique({
    where: { id },
    select: { userId: true, status: true },
  })

  if (!existing || existing.userId !== userId) {
    throw new Error("Credit nota niet gevonden")
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Alleen concept credit nota's kunnen worden bewerkt")
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
      originalInvoiceItemId: item.originalInvoiceItemId || null,
    }
  })

  // Verwijder bestaande items
  await db.creditNoteItem.deleteMany({
    where: { creditNoteId: id },
  })

  // Get current credit note for audit logging
  const currentCreditNote = await db.creditNote.findUnique({
    where: { id },
    include: { items: true },
  })

  const updateData: Record<string, unknown> = {
    customerId: validated.customerId,
    creditNoteDate: validated.creditNoteDate,
    reason: validated.reason as CreditNoteReason,
    originalInvoiceId: validated.originalInvoiceId || null,
    originalInvoiceNumber: validated.originalInvoiceNumber || null,
    subtotal: roundToTwo(subtotal),
    vatAmount: roundToTwo(vatAmount),
    total: roundToTwo(total),
    description: validated.description,
    notes: validated.notes,
    internalNotes: validated.internalNotes,
    items: {
      create: itemsWithTotals,
    },
  }

  if (status) {
    updateData.status = status
    if (status === "FINAL") {
      updateData.finalizedAt = new Date()
    }
  }

  const creditNote = await db.creditNote.update({
    where: { id, userId },
    data: updateData,
    include: {
      items: true,
    },
  })

  // Log audit trail
  if (currentCreditNote) {
    await logUpdate(
      "creditNote",
      id,
      {
        customerId: currentCreditNote.customerId,
        creditNoteDate: currentCreditNote.creditNoteDate,
        status: currentCreditNote.status,
        reason: currentCreditNote.reason,
        subtotal: currentCreditNote.subtotal.toNumber(),
        vatAmount: currentCreditNote.vatAmount.toNumber(),
        total: currentCreditNote.total.toNumber(),
      },
      {
        customerId: creditNote.customerId,
        creditNoteDate: creditNote.creditNoteDate,
        status: creditNote.status,
        reason: creditNote.reason,
        subtotal: creditNote.subtotal.toNumber(),
        vatAmount: creditNote.vatAmount.toNumber(),
        total: creditNote.total.toNumber(),
      },
      userId
    )
  }

  revalidatePath("/creditnotas")
  revalidatePath(`/creditnotas/${id}`)
  revalidatePath("/")
  return creditNote
}

export async function updateCreditNoteStatus(
  id: string,
  status: CreditNoteStatus
) {
  const userId = await getCurrentUserId()

  // Get current credit note
  const currentCreditNote = await db.creditNote.findUnique({
    where: { id },
    select: { userId: true, status: true, total: true },
  })

  if (!currentCreditNote || currentCreditNote.userId !== userId) {
    throw new Error("Credit nota niet gevonden")
  }

  // Validate status transitions
  const validTransitions: Record<CreditNoteStatus, CreditNoteStatus[]> = {
    DRAFT: ["FINAL"],
    FINAL: ["SENT"],
    SENT: ["PROCESSED", "REFUNDED"],
    PROCESSED: ["REFUNDED"],
    REFUNDED: [],
  }

  if (!validTransitions[currentCreditNote.status].includes(status)) {
    throw new Error(`Ongeldige statusovergang van ${currentCreditNote.status} naar ${status}`)
  }

  const updateData: Record<string, unknown> = { status }

  if (status === "FINAL") {
    updateData.finalizedAt = new Date()
  } else if (status === "SENT") {
    updateData.sentAt = new Date()
  } else if (status === "PROCESSED") {
    updateData.processedAt = new Date()
  } else if (status === "REFUNDED") {
    updateData.refundedAt = new Date()
  }

  const creditNote = await db.creditNote.update({
    where: { id },
    data: updateData,
  })

  // Log audit trail
  await logUpdate(
    "creditNote",
    id,
    { status: currentCreditNote.status },
    { status: creditNote.status },
    userId
  )

  revalidatePath("/creditnotas")
  revalidatePath(`/creditnotas/${id}`)
  revalidatePath("/")

  return {
    ...creditNote,
    subtotal: creditNote.subtotal.toNumber(),
    vatAmount: creditNote.vatAmount.toNumber(),
    total: creditNote.total.toNumber(),
  }
}

export async function deleteCreditNote(id: string) {
  const userId = await getCurrentUserId()

  // Get credit note data before deletion for audit logging
  const creditNote = await db.creditNote.findUnique({
    where: { id },
    select: {
      userId: true,
      creditNoteNumber: true,
      customerId: true,
      total: true,
      status: true,
      reason: true,
    },
  })

  if (!creditNote || creditNote.userId !== userId) {
    throw new Error("Credit nota niet gevonden")
  }

  if (creditNote.status !== "DRAFT") {
    throw new Error("Alleen concept credit nota's kunnen worden verwijderd")
  }

  await db.creditNote.delete({
    where: { id, userId },
  })

  // Log audit trail
  await logDelete(
    "creditNote",
    id,
    {
      creditNoteNumber: creditNote.creditNoteNumber,
      customerId: creditNote.customerId,
      total: creditNote.total.toNumber(),
      status: creditNote.status,
      reason: creditNote.reason,
    },
    userId
  )

  revalidatePath("/creditnotas")
  revalidatePath("/")
}

export async function createCreditNoteFromInvoice(
  invoiceId: string,
  full: boolean = true,
  selectedItems?: string[]
) {
  const userId = await getCurrentUserId()

  // Get the invoice
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
      customer: true,
    },
  })

  if (!invoice || invoice.userId !== userId) {
    throw new Error("Factuur niet gevonden")
  }

  // Filter items if partial credit note
  let itemsToCredit = invoice.items
  if (!full && selectedItems && selectedItems.length > 0) {
    itemsToCredit = invoice.items.filter((item) => selectedItems.includes(item.id))
  }

  if (itemsToCredit.length === 0) {
    throw new Error("Selecteer minimaal één regel om te crediteren")
  }

  // Prepare credit note data
  const creditNoteData: CreditNoteFormData = {
    customerId: invoice.customerId,
    creditNoteDate: new Date(),
    reason: full ? "CANCELLATION" : "PRICE_CORRECTION",
    originalInvoiceId: invoice.id,
    originalInvoiceNumber: invoice.invoiceNumber,
    description: `Credit nota voor factuur ${invoice.invoiceNumber}`,
    notes: null,
    internalNotes: null,
    items: itemsToCredit.map((item) => ({
      description: item.description,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      unit: item.unit,
      originalInvoiceItemId: item.id,
    })),
  }

  return createCreditNote(creditNoteData, "DRAFT")
}

export async function getInvoiceForCreditNote(invoiceId: string) {
  const userId = await getCurrentUserId()

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: "asc" },
      },
      creditNotes: {
        select: {
          id: true,
          creditNoteNumber: true,
          total: true,
          status: true,
        },
      },
    },
  })

  if (!invoice || invoice.userId !== userId) {
    return null
  }

  // Calculate already credited amount
  const creditedAmount = invoice.creditNotes
    .filter((cn) => cn.status !== "DRAFT")
    .reduce((sum, cn) => sum + cn.total.toNumber(), 0)

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
      total: item.total.toNumber(),
    })),
    creditNotes: invoice.creditNotes.map((cn) => ({
      ...cn,
      total: cn.total.toNumber(),
    })),
    creditedAmount,
    remainingAmount: invoice.total.toNumber() - creditedAmount,
  }
}

export async function getCreditNotesForInvoice(invoiceId: string) {
  const userId = await getCurrentUserId()

  // Verify invoice belongs to user
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { userId: true },
  })

  if (!invoice || invoice.userId !== userId) {
    return []
  }

  const creditNotes = await db.creditNote.findMany({
    where: {
      originalInvoiceId: invoiceId,
    },
    orderBy: { creditNoteDate: "desc" },
    select: {
      id: true,
      creditNoteNumber: true,
      creditNoteDate: true,
      status: true,
      reason: true,
      total: true,
    },
  })

  return creditNotes.map((cn) => ({
    ...cn,
    total: cn.total.toNumber(),
  }))
}

export async function getCreditNoteStats() {
  const userId = await getCurrentUserId()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    draftCreditNotes,
    processedThisMonth,
    processedThisYear,
    totalPending,
  ] = await Promise.all([
    // Concept credit nota's
    db.creditNote.aggregate({
      where: {
        userId,
        status: "DRAFT",
      },
      _sum: { total: true },
      _count: true,
    }),

    // Verwerkt deze maand
    db.creditNote.aggregate({
      where: {
        userId,
        status: { in: ["PROCESSED", "REFUNDED"] },
        processedAt: { gte: startOfMonth },
      },
      _sum: { total: true },
      _count: true,
    }),

    // Verwerkt dit jaar
    db.creditNote.aggregate({
      where: {
        userId,
        status: { in: ["PROCESSED", "REFUNDED"] },
        processedAt: { gte: startOfYear },
      },
      _sum: { total: true },
    }),

    // Openstaand (FINAL + SENT)
    db.creditNote.aggregate({
      where: {
        userId,
        status: { in: ["FINAL", "SENT"] },
      },
      _sum: { total: true },
      _count: true,
    }),
  ])

  return {
    draftCount: draftCreditNotes._count,
    draftAmount: draftCreditNotes._sum.total?.toNumber() ?? 0,
    processedThisMonthCount: processedThisMonth._count,
    processedThisMonthAmount: processedThisMonth._sum.total?.toNumber() ?? 0,
    processedThisYearAmount: processedThisYear._sum.total?.toNumber() ?? 0,
    pendingCount: totalPending._count,
    pendingAmount: totalPending._sum.total?.toNumber() ?? 0,
  }
}
