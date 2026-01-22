import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { syncPaymentStatus } from "@/lib/mollie/payments"

interface CompletePageProps {
  params: Promise<{ token: string }>
}

export default async function CompletePage({ params }: CompletePageProps) {
  const { token } = await params

  // Get invoice by token
  const invoice = await db.invoice.findUnique({
    where: { paymentLinkToken: token },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (!invoice) {
    redirect("/pay/failed")
  }

  // If there's a recent payment, sync its status
  const latestPayment = invoice.payments[0]
  if (latestPayment) {
    await syncPaymentStatus(latestPayment.id)

    // Reload to get updated status
    const updatedPayment = await db.payment.findUnique({
      where: { id: latestPayment.id },
    })

    if (updatedPayment) {
      switch (updatedPayment.mollieStatus) {
        case "paid":
          redirect("/pay/success")
        case "failed":
          redirect("/pay/failed")
        case "canceled":
          redirect(`/pay/${token}?canceled=true`)
        case "expired":
          redirect("/pay/expired")
        case "open":
        case "pending":
          // Still processing, show pending page
          redirect("/pay/pending")
        default:
          redirect("/pay/failed")
      }
    }
  }

  // No payment found, redirect back to payment page
  redirect(`/pay/${token}`)
}
