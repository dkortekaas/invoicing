import { db } from "@/lib/db"
import { decryptApiKey } from "./encryption"
import type { MollieConfig, MolliePaymentResponse } from "./types"

const MOLLIE_API_BASE = "https://api.mollie.com/v2"

/**
 * Get Mollie configuration for a user
 */
export async function getMollieConfig(userId: string): Promise<MollieConfig | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      mollieApiKey: true,
      mollieProfileId: true,
      mollieEnabled: true,
      mollieTestMode: true,
    },
  })

  if (!user || !user.mollieEnabled || !user.mollieApiKey) {
    return null
  }

  try {
    const apiKey = decryptApiKey(user.mollieApiKey)
    return {
      apiKey,
      profileId: user.mollieProfileId ?? undefined,
      testMode: user.mollieTestMode,
    }
  } catch (error) {
    console.error("Failed to decrypt Mollie API key:", error)
    return null
  }
}

/**
 * Get Mollie configuration from an invoice (via the invoice owner)
 */
export async function getMollieConfigFromInvoice(invoiceId: string): Promise<MollieConfig | null> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { userId: true },
  })

  if (!invoice) {
    return null
  }

  return getMollieConfig(invoice.userId)
}

/**
 * Mollie API client for making authenticated requests
 */
export class MollieClient {
  private apiKey: string
  private testMode: boolean

  constructor(config: MollieConfig) {
    this.apiKey = config.apiKey
    this.testMode = config.testMode
  }

  /**
   * Make an authenticated request to the Mollie API
   */
  async request<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH",
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${MOLLIE_API_BASE}${endpoint}`

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const errorMessage = errorBody?.detail || errorBody?.title || `Mollie API error: ${response.status}`
      const error = new Error(errorMessage) as Error & {
        status?: number
        mollieError?: Record<string, unknown>
      }
      error.status = response.status
      error.mollieError = errorBody
      throw error
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  /**
   * Create a payment
   */
  async createPayment(params: {
    amount: { currency: string; value: string }
    description: string
    redirectUrl: string
    webhookUrl?: string
    metadata?: Record<string, unknown>
    method?: string | string[]
    issuer?: string
    locale?: string
  }): Promise<MolliePaymentResponse> {
    return this.request<MolliePaymentResponse>("POST", "/payments", params)
  }

  /**
   * Get a payment by ID
   */
  async getPayment(paymentId: string): Promise<MolliePaymentResponse> {
    return this.request<MolliePaymentResponse>("GET", `/payments/${paymentId}`)
  }

  /**
   * Get available iDEAL issuers
   */
  async getIdealIssuers() {
    const response = await this.request<{ count: number; _embedded: { issuers: Array<{ id: string; name: string; image: Record<string, string> }> } }>(
      "GET",
      "/methods/ideal?include=issuers"
    )
    return response._embedded?.issuers || []
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(params?: { locale?: string; amount?: { currency: string; value: string } }) {
    let endpoint = "/methods"
    const queryParams = new URLSearchParams()

    if (params?.locale) {
      queryParams.set("locale", params.locale)
    }
    if (params?.amount) {
      queryParams.set("amount[currency]", params.amount.currency)
      queryParams.set("amount[value]", params.amount.value)
    }

    const queryString = queryParams.toString()
    if (queryString) {
      endpoint += `?${queryString}`
    }

    return this.request<{ count: number; _embedded: { methods: Array<{ id: string; description: string; image: Record<string, string> }> } }>(
      "GET",
      endpoint
    )
  }

  /**
   * Test connection to Mollie API.
   * Uses GET /methods (works in both test and live mode); /organizations/me is live-only.
   */
  async testConnection(): Promise<{ success: boolean; mode: "test" | "live"; error?: string }> {
    try {
      await this.request<{ count: number }>("GET", "/methods")
      return {
        success: true,
        mode: this.testMode ? "test" : "live",
      }
    } catch (error) {
      const err = error as Error & { status?: number }
      return {
        success: false,
        mode: this.testMode ? "test" : "live",
        error: err.message || "Connection failed",
      }
    }
  }
}

/**
 * Create a Mollie client for a user
 */
export async function createMollieClient(userId: string): Promise<MollieClient | null> {
  const config = await getMollieConfig(userId)
  if (!config) {
    return null
  }
  return new MollieClient(config)
}

/**
 * Create a Mollie client from invoice
 */
export async function createMollieClientFromInvoice(invoiceId: string): Promise<MollieClient | null> {
  const config = await getMollieConfigFromInvoice(invoiceId)
  if (!config) {
    return null
  }
  return new MollieClient(config)
}
