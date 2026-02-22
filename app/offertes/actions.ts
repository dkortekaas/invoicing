"use server"

import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/server-utils"
import { Prisma, type QuoteStatus } from "@prisma/client"
import { sendSigningReminderEmail } from "@/lib/email/send-quote-signing"

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
