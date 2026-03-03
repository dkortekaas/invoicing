import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import type { Locale } from "@/lib/i18n"
import { getMessages, getNested } from "@/lib/i18n"

function getUtilsT(locale: Locale) {
  const utilsMessages = getNested(
    getMessages(locale) as Record<string, unknown>,
    "utils"
  ) as Record<string, string> | undefined
  return (key: string): string => (utilsMessages?.[key] as string) ?? key
}

/** Get all translated utils constants for a locale. Use in server components with getAppLocale(). */
export function getTranslatedUtils(locale: Locale) {
  const t = getUtilsT(locale)
  return {
    VAT_RATES: [
      { value: "21", label: t("vatRate21") },
      { value: "9", label: t("vatRate9") },
      { value: "0", label: t("vatRate0") },
    ] as const,
    UNITS: [
      { value: "uur", label: t("unitHour") },
      { value: "dag", label: t("unitDay") },
      { value: "stuk", label: t("unitPiece") },
      { value: "maand", label: t("unitMonth") },
      { value: "project", label: t("unitProject") },
      { value: "km", label: t("unitKilometer") },
    ] as const,
    STATUS_LABELS: {
      DRAFT: t("statusDraft"),
      SENT: t("statusSent"),
      PAID: t("statusPaid"),
      OVERDUE: t("statusOverdue"),
      CANCELLED: t("statusCancelled"),
    } as Record<string, string>,
    CREDIT_NOTE_STATUS_LABELS: {
      DRAFT: t("statusDraft"),
      FINAL: t("statusFinal"),
      SENT: t("statusSent"),
      PROCESSED: t("statusProcessed"),
      REFUNDED: t("statusRefunded"),
    } as Record<string, string>,
    QUOTE_STATUS_LABELS: {
      DRAFT: t("statusDraft"),
      SENT: t("statusSent"),
      VIEWED: t("statusViewed"),
      SIGNED: t("statusSigned"),
      DECLINED: t("statusDeclined"),
      EXPIRED: t("statusExpired"),
      CONVERTED: t("statusConverted"),
    } as Record<string, string>,
    SIGNING_STATUS_LABELS: {
      NOT_SENT: t("statusNotSent"),
      PENDING: t("statusPending"),
      VIEWED: t("statusViewed"),
      SIGNED: t("statusSigned"),
      DECLINED: t("statusDeclined"),
      EXPIRED: t("statusExpired"),
    } as Record<string, string>,
    CREDIT_NOTE_REASON_LABELS: {
      PRICE_CORRECTION: t("creditNoteReasonPriceCorrection"),
      QUANTITY_CORRECTION: t("creditNoteReasonQuantityCorrection"),
      RETURN: t("creditNoteReasonReturn"),
      CANCELLATION: t("creditNoteReasonCancellation"),
      DISCOUNT_AFTER: t("creditNoteReasonDiscountAfter"),
      VAT_CORRECTION: t("creditNoteReasonVatCorrection"),
      DUPLICATE_INVOICE: t("creditNoteReasonDuplicateInvoice"),
      GOODWILL: t("creditNoteReasonGoodwill"),
      OTHER: t("creditNoteReasonOther"),
    } as Record<string, string>,
    CREDIT_NOTE_REASONS: [
      { value: "PRICE_CORRECTION", label: t("creditNoteReasonPriceCorrection") },
      { value: "QUANTITY_CORRECTION", label: t("creditNoteReasonQuantityCorrection") },
      { value: "RETURN", label: t("creditNoteReasonReturn") },
      { value: "CANCELLATION", label: t("creditNoteReasonCancellation") },
      { value: "DISCOUNT_AFTER", label: t("creditNoteReasonDiscountAfter") },
      { value: "VAT_CORRECTION", label: t("creditNoteReasonVatCorrection") },
      { value: "DUPLICATE_INVOICE", label: t("creditNoteReasonDuplicateInvoice") },
      { value: "GOODWILL", label: t("creditNoteReasonGoodwill") },
      { value: "OTHER", label: t("creditNoteReasonOther") },
    ] as const,
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to check if value is Decimal-like (has toNumber method)
function isDecimalLike(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  )
}

// Nederlandse datum formatting (dd-MM-yyyy)
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd-MM-yyyy", { locale: nl })
}

// Nederlandse datum met dag naam
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "d MMMM yyyy", { locale: nl })
}

// Nederlands bedrag formaat: € 1.234,56
export function formatCurrency(amount: number | { toNumber: () => number } | string): string {
  const num = typeof amount === "string"
    ? parseFloat(amount)
    : isDecimalLike(amount)
      ? amount.toNumber()
      : amount

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(num)
}

// Currency decimal places (0 for JPY, 2 for most others)
const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  BHD: 3,
  KWD: 3,
  OMR: 3,
}

// Format amount with any currency code
export function formatCurrencyWithCode(
  amount: number | { toNumber: () => number } | string,
  currencyCode: string = "EUR"
): string {
  const num = typeof amount === "string"
    ? parseFloat(amount)
    : isDecimalLike(amount)
      ? amount.toNumber()
      : amount

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currencyCode,
  }).format(num)
}

// Get decimal places for a currency
export function getCurrencyDecimals(currencyCode: string): number {
  return CURRENCY_DECIMALS[currencyCode] ?? 2
}

// Format exchange rate (1 EUR = X foreign)
export function formatExchangeRate(rate: number, decimals: number = 4): string {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate)
}

// Format number met Nederlandse notatie (1.234,56)
export function formatNumber(num: number | { toNumber: () => number } | string, decimals = 2): string {
  const value = typeof num === "string"
    ? parseFloat(num)
    : isDecimalLike(num)
      ? num.toNumber()
      : num

  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Parse Nederlands nummer format naar number
export function parseNlNumber(str: string): number {
  // Vervang punt (duizendtallen) en komma (decimaal)
  return parseFloat(str.replace(/\./g, "").replace(",", "."))
}

// Bereken BTW bedrag
export function calculateVatAmount(subtotal: number, vatRate: number): number {
  return subtotal * (vatRate / 100)
}

// Bereken item totaal
export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

// Round to 2 decimals
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

// Generate factuurnummer: YYYY-0001
export function generateInvoiceNumber(year: number, sequence: number): string {
  return `${year}-${sequence.toString().padStart(4, "0")}`
}

// Bereken vervaldatum op basis van betalingstermijn
export function calculateDueDate(invoiceDate: Date, paymentTermDays: number): Date {
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + paymentTermDays)
  return dueDate
}

// Check of factuur achterstallig is
export function isOverdue(dueDate: Date, status: string): boolean {
  if (status === "PAID" || status === "CANCELLED" || status === "DRAFT") {
    return false
  }
  return new Date() > new Date(dueDate)
}

// BTW tarieven (default nl, use getTranslatedUtils(locale) for locale-aware)
export const VAT_RATES = getTranslatedUtils("nl").VAT_RATES

// Eenheden (default nl, use getTranslatedUtils(locale) for locale-aware)
export const UNITS = getTranslatedUtils("nl").UNITS

// Invoice Status labels (default nl, use getTranslatedUtils(locale) for locale-aware)
export const STATUS_LABELS: Record<string, string> = getTranslatedUtils("nl").STATUS_LABELS

// Invoice Status kleuren voor badges
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
}

// Generate credit nota nummer: CN-YYYY-0001
export function generateCreditNoteNumber(year: number, sequence: number): string {
  return `CN-${year}-${sequence.toString().padStart(4, "0")}`
}

// Credit Note Status labels (default nl, use getTranslatedUtils(locale) for locale-aware)
export const CREDIT_NOTE_STATUS_LABELS: Record<string, string> =
  getTranslatedUtils("nl").CREDIT_NOTE_STATUS_LABELS

// Credit Note Status kleuren voor badges
export const CREDIT_NOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  FINAL: "bg-purple-100 text-purple-800",
  SENT: "bg-blue-100 text-blue-800",
  PROCESSED: "bg-green-100 text-green-800",
  REFUNDED: "bg-emerald-100 text-emerald-800",
}

// Quote Status labels (default nl, use getTranslatedUtils(locale) for locale-aware)
export const QUOTE_STATUS_LABELS: Record<string, string> =
  getTranslatedUtils("nl").QUOTE_STATUS_LABELS

// Quote Status kleuren voor badges
export const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  VIEWED: "bg-indigo-100 text-indigo-800",
  SIGNED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  CONVERTED: "bg-purple-100 text-purple-800",
}

// Signing Status labels (default nl, use getTranslatedUtils(locale) for locale-aware)
export const SIGNING_STATUS_LABELS: Record<string, string> =
  getTranslatedUtils("nl").SIGNING_STATUS_LABELS

// Signing Status kleuren voor badges
export const SIGNING_STATUS_COLORS: Record<string, string> = {
  NOT_SENT: "bg-gray-100 text-gray-500",
  PENDING: "bg-yellow-100 text-yellow-800",
  VIEWED: "bg-blue-100 text-blue-800",
  SIGNED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
}

// Credit Note Reason labels (default nl, use getTranslatedUtils(locale) for locale-aware)
export const CREDIT_NOTE_REASON_LABELS: Record<string, string> =
  getTranslatedUtils("nl").CREDIT_NOTE_REASON_LABELS

// Credit Note Reason options for forms (default nl, use getTranslatedUtils(locale) for locale-aware)
export const CREDIT_NOTE_REASONS = getTranslatedUtils("nl").CREDIT_NOTE_REASONS
