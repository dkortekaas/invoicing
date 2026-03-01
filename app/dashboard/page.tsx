import Link from "next/link"
import { Euro, FileText, Users, AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SigningPendingWidget } from "@/components/dashboard/signing-pending-widget"
import { AccountingSyncWidget } from "@/components/accounting/AccountingSyncWidget"
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats, getRecentInvoices } from "@/app/facturen/actions"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"
import { T } from "@/components/t"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const userId = await getCurrentUserId()

  const [stats, recentInvoices, activeConnectionCount] = await Promise.all([
    getDashboardStats(),
    getRecentInvoices(5),
    db.accountingConnection.count({ where: { userId, isActive: true } }),
  ])

  const hasAccountingConnections = activeConnectionCount > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight"><T ns="dashboardPage" k="title" /></h2>
          <p className="text-muted-foreground">
            <T ns="dashboardPage" k="description" />
          </p>
        </div>
        <Button asChild>
          <Link href="/facturen/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            <T ns="dashboardPage" k="newInvoice" />
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={<T ns="dashboardPage" k="outstanding" />}
          value={formatCurrency(stats.totalOutstanding)}
          description={<>{stats.invoiceCount} <T ns="dashboardPage" k="invoices" /></>}
          icon={Euro}
        />
        <StatsCard
          title={<T ns="dashboardPage" k="overdue" />}
          value={formatCurrency(stats.overdueAmount)}
          description={<>{stats.overdueCount} <T ns="dashboardPage" k="invoices" /></>}
          icon={AlertTriangle}
          className={stats.overdueCount > 0 ? "border-red-200 bg-red-50" : ""}
        />
        <StatsCard
          title={<T ns="dashboardPage" k="revenueThisMonth" />}
          value={formatCurrency(stats.revenueThisMonth)}
          icon={FileText}
        />
        <StatsCard
          title={<T ns="dashboardPage" k="customers" />}
          value={stats.customerCount.toString()}
          icon={Users}
        />
      </div>

      {/* Recent invoices + quick actions + accounting sync widget */}
      <div className={cn(
        "grid gap-4",
        hasAccountingConnections ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
      )}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle><T ns="dashboardPage" k="recentInvoices" /></CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/facturen"><T ns="dashboardPage" k="viewAll" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  <T ns="dashboardPage" k="noInvoices" />
                </p>
              ) : (
                recentInvoices.map((invoice: typeof recentInvoices[0]) => (
                  <Link
                    key={invoice.id}
                    href={`/facturen/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.customer.companyName || invoice.customer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(invoice.total)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-1",
                          STATUS_COLORS[invoice.status]
                        )}
                      >
                        {STATUS_LABELS[invoice.status]}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle><T ns="dashboardPage" k="quickActions" /></CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/facturen/nieuw">
                <FileText className="mr-2 h-4 w-4" />
                <T ns="dashboardPage" k="createInvoice" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/klanten/nieuw">
                <Users className="mr-2 h-4 w-4" />
                <T ns="dashboardPage" k="addCustomer" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/producten">
                <Plus className="mr-2 h-4 w-4" />
                <T ns="dashboardPage" k="manageProducts" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Accounting sync widget — only when at least one connection is active */}
        {hasAccountingConnections && <AccountingSyncWidget />}
      </div>

      {/* Signing pending widget */}
      <SigningPendingWidget />

      {/* Revenue overview */}
      <Card>
        <CardHeader>
          <CardTitle>
            <T ns="dashboardPage" k="revenueThisYear" vars={{ year: String(new Date().getFullYear()) }} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(stats.revenueThisYear)}
          </div>
          <p className="text-sm text-muted-foreground">
            <T ns="dashboardPage" k="totalRevenueYear" />
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
