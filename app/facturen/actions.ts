"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { Prisma, type Invoice, type InvoiceItem, type InvoiceStatus } from "@prisma/client"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations"
import { generateInvoiceNumber, roundToTwo } from "@/lib/utils"
import { getCurrentUserId } from "@/lib/server-utils"
import { logCreate, logUpdate, logDelete, logPaymentRecorded } from "@/lib/audit/helpers"
import { requireCompanyDetails } from "@/lib/company-guard"
import {
  getExchangeRate,
  calculateEurEquivalents,
  lockInvoiceExchangeRate,
} from "@/lib/currency"

interface GetInvoicesOptions {
  status?: InvoiceStatus | string
  search?: string
  year?: number
  sortBy?: "invoiceNumber" | "customerName" | "invoiceDate" | "dueDate" | "total"
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export async function getInvoices(options: GetInvoicesOptions = {}) {
  const userId = await getCurrentUserId()
  const {
    status,
    search,
    year,
    sortBy = "invoiceDate",
    sortOrder = "desc",
    page = 1,
    pageSize = 50,
  } = options

  const where: Prisma.InvoiceWhereInput = { userId }

  if (status && status !== "ALL") {
    where.status = status as InvoiceStatus
  }
  if (year) {
    where.invoiceDate = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    }
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ]
  }

  const orderBy: Prisma.InvoiceOrderByWithRelationInput =
    sortBy === "customerName"
      ? { customer: { name: sortOrder } }
      : { [sortBy]: sortOrder }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      // Do not include items — the list view does not need them
      include: {
        customer: {
          select: { name: true, companyName: true },
        },
      },
    }),
    db.invoice.count({ where }),
  ])

  return {
    invoices: invoices.map((invoice) => ({
      ...invoice,
      subtotal: invoice.subtotal.toNumber(),
      vatAmount: invoice.vatAmount.toNumber(),
      total: invoice.total.toNumber(),
    })),
    total,
  }
}

/** Returns invoice counts grouped by status (for the filter tabs). */
export async function getInvoiceStatusCounts() {
  const userId = await getCurrentUserId()
  const groups = await db.invoice.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  })
  const result = { ALL: 0, DRAFT: 0, SENT: 0, PAID: 0, OVERDUE: 0, CANCELLED: 0 }
  for (const g of groups) {
    const key = g.status as keyof typeof result
    if (key in result) result[key] = g._count.status
    result.ALL += g._count.status
  }
  return result
}

/** Returns the distinct years for which invoices exist (for the year filter). */
export async function getInvoiceYears(): Promise<number[]> {
  const userId = await getCurrentUserId()
  const rows = await db.$queryRaw<{ year: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM "invoiceDate")::int AS year
    FROM "Invoice"
    WHERE "userId" = ${userId}
    ORDER BY year DESC
  `
  return rows.map((r) => r.year)
}

export async function getInvoice(id: string) {
  const userId = await getCurrentUserId()
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      currency: true,
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

  // Convert Decimal fields to numbers for serialization (Client Components require plain objects)
  const { user: rawUser, ...rest } = invoice
  return {
    ...rest,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    exchangeRate: invoice.exchangeRate?.toNumber() ?? null,
    subtotalEur: invoice.subtotalEur?.toNumber() ?? null,
    vatAmountEur: invoice.vatAmountEur?.toNumber() ?? null,
    totalEur: invoice.totalEur?.toNumber() ?? null,
    user: {
      ...rawUser,
      defaultHourlyRate: rawUser.defaultHourlyRate?.toNumber() ?? null,
    },
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
      total: item.total.toNumber(),
    })),
  }
}

export async function getNextInvoiceNumber() {
  const userId = await getCurrentUserId()
  const year = new Date().getFullYear()
  const prefix = `${year}-`

  // Numerieke max sequence (string-sorteer zou 2025-0009 > 2025-0010 geven)
  const result = await db.$queryRaw<[{ max_seq: number | null }]>(
    Prisma.sql`
      SELECT MAX(
        CAST(SUBSTRING("invoiceNumber" FROM POSITION('-' IN "invoiceNumber") + 1) AS INTEGER)
      ) AS max_seq
      FROM "Invoice"
      WHERE "userId" = ${userId} AND "invoiceNumber" LIKE ${prefix + "%"}
    `
  )
  const maxSeq = result[0]?.max_seq ?? 0
  const sequence = maxSeq + 1

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

  // Check if user has KOR (Kleineondernemersregeling) enabled
  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId },
    select: { useKOR: true },
  })
  const useKOR = fiscalSettings?.useKOR ?? false

  // Bereken totalen
  let subtotal = 0
  let vatAmount = 0
  let total = 0

  const itemsWithTotals = validated.items.map((item: typeof validated.items[0], index: number) => {
    const itemSubtotal = roundToTwo(item.quantity * item.unitPrice)
    // KOR: geen BTW berekenen
    const effectiveVatRate = useKOR ? 0 : item.vatRate
    const itemVatAmount = roundToTwo(itemSubtotal * (effectiveVatRate / 100))
    const itemTotal = roundToTwo(itemSubtotal + itemVatAmount)

    subtotal += itemSubtotal
    vatAmount += itemVatAmount
    total += itemTotal

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: effectiveVatRate,
      unit: item.unit,
      subtotal: itemSubtotal,
      vatAmount: itemVatAmount,
      total: itemTotal,
      sortOrder: index,
    }
  })

  // Handle currency - default to EUR if not specified
  const currencyCode = validated.currencyCode || "EUR"

  // Get currency ID
  const currency = await db.currency.findUnique({
    where: { code: currencyCode },
    select: { id: true },
  })

  // Calculate EUR equivalents if not EUR
  let currencyData: {
    currencyId?: string
    currencyCode: string
    exchangeRate?: Prisma.Decimal
    exchangeRateDate?: Date
    exchangeRateSource?: "ECB" | "MANUAL"
    subtotalEur?: Prisma.Decimal
    vatAmountEur?: Prisma.Decimal
    totalEur?: Prisma.Decimal
  } = {
    currencyCode,
    currencyId: currency?.id,
  }

  if (currencyCode !== "EUR") {
    try {
      const rateInfo = await getExchangeRate({
        from: currencyCode,
        to: "EUR",
      })

      const eurEquivalents = calculateEurEquivalents(
        { subtotal: roundToTwo(subtotal), vatAmount: roundToTwo(vatAmount), total: roundToTwo(total) },
        rateInfo.rate
      )

      currencyData = {
        ...currencyData,
        exchangeRate: new Prisma.Decimal(rateInfo.inverseRate.toFixed(6)),
        exchangeRateDate: rateInfo.date,
        exchangeRateSource: rateInfo.source,
        subtotalEur: new Prisma.Decimal(eurEquivalents.subtotalEur.toFixed(2)),
        vatAmountEur: new Prisma.Decimal(eurEquivalents.vatAmountEur.toFixed(2)),
        totalEur: new Prisma.Decimal(eurEquivalents.totalEur.toFixed(2)),
      }
    } catch {
      // No rate available, leave EUR fields null
      console.warn(`No exchange rate available for ${currencyCode}`)
    }
  }

  const maxAttempts = 3
  let invoice: (Invoice & { items: InvoiceItem[] }) | undefined
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const invoiceNumber = await getNextInvoiceNumber()
    try {
      invoice = await db.invoice.create({
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
          ...currencyData,
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
      break
    } catch (err) {
      const isP2002 =
        typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002"
      const isInvoiceNumberConflict =
        isP2002 &&
        (!(err as { meta?: { target?: unknown } }).meta?.target ||
          (Array.isArray((err as { meta?: { target?: string[] } }).meta?.target) &&
            (err as { meta?: { target?: string[] } }).meta?.target?.includes("invoiceNumber")))
      if (!isInvoiceNumberConflict || attempt === maxAttempts - 1) throw err
      // Korte pauze zodat een concurrerende insert kan committen; daarna haalt getNextInvoiceNumber() een nieuw nummer op
      await new Promise((r) => setTimeout(r, 80))
    }
  }

  if (!invoice) {
    throw new Error("Factuur aanmaken mislukt")
  }

  // Lock exchange rate if sending immediately
  if (status === "SENT" && currencyCode !== "EUR") {
    await lockInvoiceExchangeRate(invoice.id)
  }

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

  // Convert Decimal to number so the return value is serializable for Client Components
  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    exchangeRate: invoice.exchangeRate?.toNumber() ?? null,
    subtotalEur: invoice.subtotalEur?.toNumber() ?? null,
    vatAmountEur: invoice.vatAmountEur?.toNumber() ?? null,
    totalEur: invoice.totalEur?.toNumber() ?? null,
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
      total: item.total.toNumber(),
    })),
  }
}

export async function updateInvoice(
  id: string,
  data: InvoiceFormData,
  status?: "DRAFT" | "SENT"
) {
  const userId = await getCurrentUserId()

  // Check if invoice is paid - paid invoices cannot be edited
  const existingInvoice = await db.invoice.findUnique({
    where: { id, userId },
    select: { status: true },
  })
  if (!existingInvoice) {
    throw new Error("Factuur niet gevonden")
  }
  if (existingInvoice.status === "PAID") {
    throw new Error("Een betaalde factuur kan niet meer bewerkt worden")
  }

  const validated = invoiceSchema.parse(data)

  // Check if user has KOR (Kleineondernemersregeling) enabled
  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId },
    select: { useKOR: true },
  })
  const useKOR = fiscalSettings?.useKOR ?? false

  // Bereken totalen
  let subtotal = 0
  let vatAmount = 0
  let total = 0

  const itemsWithTotals = validated.items.map((item: typeof validated.items[0], index: number) => {
    const itemSubtotal = roundToTwo(item.quantity * item.unitPrice)
    // KOR: geen BTW berekenen
    const effectiveVatRate = useKOR ? 0 : item.vatRate
    const itemVatAmount = roundToTwo(itemSubtotal * (effectiveVatRate / 100))
    const itemTotal = roundToTwo(itemSubtotal + itemVatAmount)

    subtotal += itemSubtotal
    vatAmount += itemVatAmount
    total += itemTotal

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: effectiveVatRate,
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

  // Convert Decimal to number so the return value is serializable for Client Components
  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    total: invoice.total.toNumber(),
    exchangeRate: invoice.exchangeRate?.toNumber() ?? null,
    subtotalEur: invoice.subtotalEur?.toNumber() ?? null,
    vatAmountEur: invoice.vatAmountEur?.toNumber() ?? null,
    totalEur: invoice.totalEur?.toNumber() ?? null,
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      vatRate: item.vatRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      vatAmount: item.vatAmount.toNumber(),
      total: item.total.toNumber(),
    })),
  }
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

  // Get current invoice for audit logging and currency handling
  const currentInvoice = await db.invoice.findUnique({
    where: { id },
    select: { userId: true, status: true, total: true, currencyCode: true, exchangeRateLocked: true },
  })

  if (!currentInvoice || currentInvoice.userId !== userId) {
    throw new Error("Factuur niet gevonden")
  }

  const invoice = await db.invoice.update({
    where: { id },
    data: updateData,
  })

  // Lock exchange rate when sending a non-EUR invoice
  if (status === "SENT" && currentInvoice.currencyCode !== "EUR" && !currentInvoice.exchangeRateLocked) {
    await lockInvoiceExchangeRate(id)
  }

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

  // Paid invoices cannot be deleted
  if (invoice.status === "PAID") {
    throw new Error("Een betaalde factuur kan niet verwijderd worden")
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
