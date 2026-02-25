"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { requireCompanyDetails } from "@/lib/company-guard"
import { Prisma, type QuoteStatus } from "@prisma/client"
import { sendSigningReminderEmail } from "@/lib/email/send-quote-signing"
import { roundToTwo } from "@/lib/utils"
import { quoteSchema, type QuoteFormData } from "@/lib/validations"

interface GetQuotesOptions {
  status?: QuoteStatus | "ALL"
  signingStatus?: string | "ALL"
  search?: string
  year?: number
  sortBy?: "quoteNumber" | "customerName" | "quoteDate" | "expiryDate" | "total"
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export async function getQuotes(options: GetQuotesOptions = {}) {
  const userId = await getCurrentUserId()
  const {
    status,
    signingStatus,
    search,
    year,
    sortBy = "quoteDate",
    sortOrder = "desc",
    page = 1,
    pageSize = 50,
  } = options

  const where: Prisma.QuoteWhereInput = { userId }

  if (status && status !== "ALL") {
    where.status = status as QuoteStatus
  }
  if (signingStatus && signingStatus !== "ALL") {
    where.signingStatus = signingStatus === "NOT_SENT" ? null : (signingStatus as never)
  }
  if (year) {
    where.quoteDate = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    }
  }
  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ]
  }

  const orderBy: Prisma.QuoteOrderByWithRelationInput =
    sortBy === "customerName"
      ? { customer: { name: sortOrder } }
      : { [sortBy]: sortOrder }

  const [quotes, total] = await Promise.all([
    db.quote.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        quoteNumber: true,
        quoteDate: true,
        expiryDate: true,
        status: true,
        signingEnabled: true,
        signingStatus: true,
        signedAt: true,
        declinedAt: true,
        sentAt: true,
        total: true,
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    }),
    db.quote.count({ where }),
  ])

  return { quotes, total }
}

export async function getQuoteStatusCounts() {
  const userId = await getCurrentUserId()

  const [all, draft, sent, viewed, signed, declined, expired, converted] =
    await Promise.all([
      db.quote.count({ where: { userId } }),
      db.quote.count({ where: { userId, status: "DRAFT" } }),
      db.quote.count({ where: { userId, status: "SENT" } }),
      db.quote.count({ where: { userId, status: "VIEWED" } }),
      db.quote.count({ where: { userId, status: "SIGNED" } }),
      db.quote.count({ where: { userId, status: "DECLINED" } }),
      db.quote.count({ where: { userId, status: "EXPIRED" } }),
      db.quote.count({ where: { userId, status: "CONVERTED" } }),
    ])

  return { ALL: all, DRAFT: draft, SENT: sent, VIEWED: viewed, SIGNED: signed, DECLINED: declined, EXPIRED: expired, CONVERTED: converted }
}

export async function getQuoteSigningStatusCounts() {
  const userId = await getCurrentUserId()

  const [pending, viewed, signed, declined, expired] = await Promise.all([
    db.quote.count({ where: { userId, signingEnabled: true, signingStatus: "PENDING" } }),
    db.quote.count({ where: { userId, signingEnabled: true, signingStatus: "VIEWED" } }),
    db.quote.count({ where: { userId, signingEnabled: true, signingStatus: "SIGNED" } }),
    db.quote.count({ where: { userId, signingEnabled: true, signingStatus: "DECLINED" } }),
    db.quote.count({ where: { userId, signingEnabled: true, signingStatus: "EXPIRED" } }),
  ])

  return { PENDING: pending, VIEWED: viewed, SIGNED: signed, DECLINED: declined, EXPIRED: expired }
}

export async function getQuoteById(id: string) {
  const userId = await getCurrentUserId()

  return db.quote.findUnique({
    where: { id, userId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      signature: true,
      signingEvents: { orderBy: { createdAt: "asc" } },
      convertedInvoice: { select: { id: true, invoiceNumber: true } },
      user: {
        select: {
          company: true,
          vatNumber: true,
          kvkNumber: true,
          iban: true,
        },
      },
    },
  })
}

export async function getQuoteYears(): Promise<number[]> {
  const userId = await getCurrentUserId()

  const quotes = await db.quote.findMany({
    where: { userId },
    select: { quoteDate: true },
    distinct: ["quoteDate"],
  })

  const years = [...new Set(quotes.map((q) => q.quoteDate.getFullYear()))].sort(
    (a, b) => b - a,
  )
  return years
}

/**
 * Haalt alle offertes op met een openstaand ondertekeningsverzoek (PENDING of VIEWED).
 * Berekent wachttijd en geeft aan of de offerte bijna verloopt (≤3 dagen).
 */
export async function getPendingSigningQuotes() {
  const userId = await getCurrentUserId()

  const quotes = await db.quote.findMany({
    where: {
      userId,
      signingEnabled: true,
      signingStatus: { in: ["PENDING", "VIEWED"] },
    },
    orderBy: { signingExpiresAt: "asc" },
    select: {
      id: true,
      quoteNumber: true,
      total: true,
      signingStatus: true,
      signingExpiresAt: true,
      sentAt: true,
      customer: { select: { name: true, companyName: true } },
    },
  })

  const now = Date.now()
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

  return quotes.map((q) => {
    const waitDays = q.sentAt
      ? Math.floor((now - q.sentAt.getTime()) / (24 * 60 * 60 * 1000))
      : null
    const expiresInMs = q.signingExpiresAt
      ? q.signingExpiresAt.getTime() - now
      : null
    const nearlyExpired =
      expiresInMs !== null && expiresInMs > 0 && expiresInMs <= THREE_DAYS_MS
    const expired = expiresInMs !== null && expiresInMs <= 0

    return { ...q, waitDays, nearlyExpired, expired }
  })
}

/**
 * Verstuurt een herinneringse-mail voor het ondertekenen van een offerte.
 * Controleert eigenaarschap en signing-status voordat de e-mail wordt verstuurd.
 */
export async function sendSigningReminder(
  quoteId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  const quote = await db.quote.findUnique({
    where: { id: quoteId, userId },
    select: { signingEnabled: true, signingStatus: true },
  })

  if (!quote || !quote.signingEnabled) {
    return { success: false, error: "Offerte niet gevonden of ondertekening niet ingeschakeld" }
  }

  if (quote.signingStatus === "SIGNED") {
    return { success: false, error: "De offerte is al ondertekend" }
  }

  if (quote.signingStatus === "DECLINED") {
    return { success: false, error: "De offerte is afgewezen" }
  }

  try {
    await sendSigningReminderEmail(quoteId, { reminderType: "MANUAL" })
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout"
    return { success: false, error: `Herinnering kon niet worden verstuurd: ${message}` }
  }
}

// ─── Offerte aanmaken / bewerken ─────────────────────────────────────────────

/**
 * Genereert het volgende offertenummer voor de ingelogde gebruiker.
 * Formaat: OFF-YYYY-0001
 */
export async function getNextQuoteNumber() {
  const userId = await getCurrentUserId()
  const year = new Date().getFullYear()
  const prefix = `OFF-${year}-`

  const result = await db.$queryRaw<[{ max_seq: number | null }]>(
    Prisma.sql`
      SELECT MAX(
        CAST(SUBSTRING("quoteNumber" FROM POSITION('-' IN "quoteNumber" FROM 5) + 1) AS INTEGER)
      ) AS max_seq
      FROM "Quote"
      WHERE "userId" = ${userId} AND "quoteNumber" LIKE ${prefix + "%"}
    `,
  )
  const maxSeq = result[0]?.max_seq ?? 0
  const sequence = maxSeq + 1
  return `${prefix}${sequence.toString().padStart(4, "0")}`
}

export async function createQuote(
  data: QuoteFormData,
  status: "DRAFT" | "SENT" = "DRAFT",
) {
  await requireCompanyDetails()
  const validated = quoteSchema.parse(data)
  const userId = await getCurrentUserId()

  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId },
    select: { useKOR: true },
  })
  const useKOR = fiscalSettings?.useKOR ?? false

  let subtotal = 0
  let vatAmount = 0
  let total = 0

  const itemsWithTotals = validated.items.map((item, index) => {
    const itemSubtotal = roundToTwo(item.quantity * item.unitPrice)
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

  const currencyCode = validated.currencyCode ?? "EUR"
  const currency = await db.currency.findUnique({
    where: { code: currencyCode },
    select: { id: true },
  })

  // Genereer offertenummer met retry bij conflict
  const maxAttempts = 3
  let quote
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const quoteNumber = await getNextQuoteNumber()
    try {
      quote = await db.quote.create({
        data: {
          userId,
          quoteNumber,
          customerId: validated.customerId,
          quoteDate: validated.quoteDate,
          expiryDate: validated.expiryDate ?? null,
          status,
          subtotal: roundToTwo(subtotal),
          vatAmount: roundToTwo(vatAmount),
          total: roundToTwo(total),
          currencyCode,
          currencyId: currency?.id,
          reference: validated.reference ?? null,
          notes: validated.notes ?? null,
          internalNotes: validated.internalNotes ?? null,
          sentAt: status === "SENT" ? new Date() : null,
          items: { create: itemsWithTotals },
        },
      })
      break
    } catch (err) {
      const isConflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
      if (!isConflict || attempt === maxAttempts - 1) throw err
      await new Promise((r) => setTimeout(r, 80))
    }
  }

  if (!quote) throw new Error("Offerte aanmaken mislukt")

  revalidatePath("/offertes")
  return quote
}

export async function updateQuote(
  id: string,
  data: QuoteFormData,
  status?: "DRAFT" | "SENT",
) {
  const validated = quoteSchema.parse(data)
  const userId = await getCurrentUserId()

  const existing = await db.quote.findUnique({
    where: { id, userId },
    select: { status: true, signingEnabled: true },
  })
  if (!existing) throw new Error("Offerte niet gevonden")
  // Geblokkeerd bewerken als al ondertekend
  if (existing.status === "SIGNED" || existing.status === "CONVERTED") {
    throw new Error("Een ondertekende of geconverteerde offerte kan niet meer worden bewerkt")
  }

  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId },
    select: { useKOR: true },
  })
  const useKOR = fiscalSettings?.useKOR ?? false

  let subtotal = 0
  let vatAmount = 0
  let total = 0

  const itemsWithTotals = validated.items.map((item, index) => {
    const itemSubtotal = roundToTwo(item.quantity * item.unitPrice)
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

  const currencyCode = validated.currencyCode ?? "EUR"
  const currency = await db.currency.findUnique({
    where: { code: currencyCode },
    select: { id: true },
  })

  const newStatus = status ?? (existing.status as "DRAFT" | "SENT")

  const quote = await db.quote.update({
    where: { id },
    data: {
      customerId: validated.customerId,
      quoteDate: validated.quoteDate,
      expiryDate: validated.expiryDate ?? null,
      status: newStatus,
      subtotal: roundToTwo(subtotal),
      vatAmount: roundToTwo(vatAmount),
      total: roundToTwo(total),
      currencyCode,
      currencyId: currency?.id,
      reference: validated.reference ?? null,
      notes: validated.notes ?? null,
      internalNotes: validated.internalNotes ?? null,
      sentAt: newStatus === "SENT" && !existing.status.includes("SENT") ? new Date() : undefined,
      items: {
        deleteMany: {},
        create: itemsWithTotals,
      },
    },
  })

  revalidatePath("/offertes")
  revalidatePath(`/offertes/${id}`)
  return quote
}

/**
 * Haalt een offerte op voor het bewerkformulier (volledige data incl. items).
 */
export async function getQuoteForEdit(id: string) {
  const userId = await getCurrentUserId()
  return db.quote.findUnique({
    where: { id, userId },
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      customerId: true,
      quoteDate: true,
      expiryDate: true,
      reference: true,
      notes: true,
      internalNotes: true,
      currencyCode: true,
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          vatRate: true,
          unit: true,
        },
      },
    },
  })
}
