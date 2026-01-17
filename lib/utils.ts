import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

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

// BTW tarieven in Nederland
export const VAT_RATES = [
  { value: "21", label: "21% (hoog tarief)" },
  { value: "9", label: "9% (laag tarief)" },
  { value: "0", label: "0% (geen BTW)" },
] as const

// Eenheden
export const UNITS = [
  { value: "uur", label: "Uur" },
  { value: "dag", label: "Dag" },
  { value: "stuk", label: "Stuk" },
  { value: "maand", label: "Maand" },
  { value: "project", label: "Project" },
  { value: "km", label: "Kilometer" },
] as const

// Status labels in Nederlands
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  PAID: "Betaald",
  OVERDUE: "Achterstallig",
  CANCELLED: "Geannuleerd",
}

// Status kleuren voor badges
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
}
