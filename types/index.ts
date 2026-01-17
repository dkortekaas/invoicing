import type { Customer, Invoice, InvoiceItem, Product, User, InvoiceStatus } from "@prisma/client"

// Re-export Prisma types
export type { Customer, Invoice, InvoiceItem, Product, User, InvoiceStatus }

// Invoice met relaties
export type InvoiceWithRelations = Invoice & {
  customer: Customer
  items: InvoiceItem[]
  user?: User
}

// Customer met relaties
export type CustomerWithInvoices = Customer & {
  invoices: Invoice[]
}

// Product uitgebreid
export type ProductWithStats = Product & {
  _count?: {
    invoiceItems?: number
  }
}

// Dashboard statistieken
export interface DashboardStats {
  totalOutstanding: number
  overdueCount: number
  overdueAmount: number
  revenueThisMonth: number
  revenueThisYear: number
  invoiceCount: number
  customerCount: number
}

// BTW groepering voor factuur
export interface VatGroup {
  rate: number
  subtotal: number
  vatAmount: number
}

// Factuur berekeningen
export interface InvoiceCalculation {
  subtotal: number
  vatGroups: VatGroup[]
  totalVat: number
  total: number
}

// Factuurregel voor formulier
export interface InvoiceItemInput {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  unit: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter opties voor facturen
export interface InvoiceFilters {
  status?: InvoiceStatus | "ALL"
  customerId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

// Session user type
export interface SessionUser {
  id: string
  email: string
  name: string | null
  companyName: string
}
