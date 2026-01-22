import { NextRequest, NextResponse } from "next/server"
import { handlePaymentWebhook } from "@/lib/mollie/webhooks"

/**
 * Mollie webhook endpoint
 * Receives POST requests when payment status changes
 *
 * Mollie sends: application/x-www-form-urlencoded with "id" field
 * Example: id=tr_WDqYK6vllg
 */
export async function POST(request: NextRequest) {
  try {
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

    // Log the webhook receipt
    console.log(`[Mollie Webhook] Received webhook for payment: ${paymentId}`)

    // Process the webhook
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

/**
 * Handle GET requests (for testing/verification)
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Mollie webhook endpoint is active",
  })
}
