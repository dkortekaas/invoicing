"use client"

import Link from "next/link"
import { Euro, FileText, Users, AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { formatCurrency, STATUS_COLORS, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/components/providers/locale-provider"

type DashboardStats = {
  totalOutstanding: number
  invoiceCount: number
  overdueCount: number
  overdueAmount: number
  revenueThisMonth: number
  revenueThisYear: number
  customerCount: number
}

type RecentInvoice = {
  id: string
  invoiceNumber: string
  status: string
  total: number
  customer: { name: string; companyName: string | null }
}

interface DashboardContentProps {
  stats: DashboardStats
  recentInvoices: RecentInvoice[]
  signingWidget?: React.ReactNode
}

export function DashboardContent({ stats, recentInvoices, signingWidget }: DashboardContentProps) {
  const { t } = useTranslations("dashboard")

  return (
    <div className="space-y-6">
      {/* Header met snelle acties */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("home.welcomeTitle")}</h2>
          <p className="text-muted-foreground">
            {t("home.welcomeSubtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/facturen/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            {t("home.newInvoice")}
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("home.outstanding")}
          value={formatCurrency(stats.totalOutstanding)}
          description={`${stats.invoiceCount} ${t("home.invoices")}`}
          icon={Euro}
        />
        <StatsCard
          title={t("home.overdue")}
          value={formatCurrency(stats.overdueAmount)}
          description={`${stats.overdueCount} ${t("home.invoices")}`}
          icon={AlertTriangle}
          className={stats.overdueCount > 0 ? "border-red-200 bg-red-50" : ""}
        />
        <StatsCard
          title={t("home.revenueThisMonth")}
          value={formatCurrency(stats.revenueThisMonth)}
          icon={FileText}
        />
        <StatsCard
          title={t("home.customers")}
          value={stats.customerCount.toString()}
          icon={Users}
        />
      </div>

      {/* Recente facturen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("home.recentInvoices")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/facturen">{t("home.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("home.noInvoicesYet")}
                </p>
              ) : (
                recentInvoices.map((invoice) => (
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
                          STATUS_COLORS[invoice.status as keyof typeof STATUS_COLORS]
                        )}
                      >
                        {t(`status.${invoice.status}`)}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Snelle acties */}
        <Card>
          <CardHeader>
            <CardTitle>{t("home.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/facturen/nieuw">
                <FileText className="mr-2 h-4 w-4" />
                {t("home.newInvoiceAction")}
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/klanten/nieuw">
                <Users className="mr-2 h-4 w-4" />
                {t("home.newCustomerAction")}
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/producten">
                <Plus className="mr-2 h-4 w-4" />
                {t("home.manageProductsAction")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Openstaande ondertekeningen */}
      {signingWidget}

      {/* Omzet overzicht */}
      <Card>
        <CardHeader>
          <CardTitle>{t("home.revenueYear").replace("{year}", new Date().getFullYear().toString())}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(stats.revenueThisYear)}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("home.revenueYearDescription")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
