import { SigningPendingWidget } from "@/components/dashboard/signing-pending-widget"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getDashboardStats, getRecentInvoices } from "@/app/facturen/actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [stats, recentInvoices] = await Promise.all([
    getDashboardStats(),
    getRecentInvoices(5),
  ])

  return (
    <DashboardContent
      stats={stats}
      recentInvoices={recentInvoices}
      signingWidget={<SigningPendingWidget />}
    />
  )
}
