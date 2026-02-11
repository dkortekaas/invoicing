import { NextRequest, NextResponse } from "next/server"
import { handlePaymentWebhook } from "@/lib/mollie/webhooks"
import { rateLimit } from "@/lib/rate-limit"

// Mollie payment IDs always start with "tr_"
const MOLLIE_PAYMENT_ID_REGEX = /^tr_[A-Za-z0-9]+$/

/**
 * Mollie webhook endpoint
 * Receives POST requests when payment status changes
 *
 * Mollie sends: application/x-www-form-urlencoded with "id" field
 * Example: id=tr_WDqYK6vllg
 *
 * Security: Mollie does not sign webhooks. Instead, we verify by:
 * 1. Validating the payment ID format
 * 2. Looking up the payment in our own database (only known payments processed)
 * 3. Fetching the real status directly from the Mollie API with our key
 * This means spoofed webhooks only trigger a DB lookup + Mollie API call,
 * never any state changes based on the webhook payload itself.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit webhook calls to prevent abuse
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { allowed } = rateLimit(`mollie-webhook:${ip}`, { maxRequests: 60, windowSeconds: 60 })
    if (!allowed) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Get the payment ID from form data
    const formData = await request.formData()
    const paymentId = formData.get("id")

    if (!paymentId || typeof paymentId !== "string") {
      console.error("[Mollie Webhook] Missing payment ID in request")
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      )
    }

    // Validate payment ID format to reject obviously fake requests
    if (!MOLLIE_PAYMENT_ID_REGEX.test(paymentId)) {
      console.error(`[Mollie Webhook] Invalid payment ID format: ${paymentId}`)
      return NextResponse.json(
        { error: "Invalid payment ID format" },
        { status: 400 }
      )
    }

    // Log the webhook receipt
    console.log(`[Mollie Webhook] Received webhook for payment: ${paymentId}`)

    // Process the webhook (verifies via Mollie API before any state changes)
    const result = await handlePaymentWebhook(paymentId)

    if (!result.success) {
      console.error(`[Mollie Webhook] Processing failed: ${result.error}`)
      // Return 200 to prevent Mollie from retrying for non-recoverable errors
      return NextResponse.json({ received: true, error: result.error })
    }

    console.log(`[Mollie Webhook] Processed successfully: ${result.action}`)
    return NextResponse.json({ received: true, action: result.action })
  } catch (error) {
    console.error("[Mollie Webhook] Unexpected error:", error)
    // Return 200 to prevent excessive retries
    return NextResponse.json(
      { received: true, error: "Internal error" },
      { status: 200 }
    )
  }
}
