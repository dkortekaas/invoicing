import Link from "next/link"
import { Euro, FileText, Users, AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats, getRecentInvoices } from "@/app/facturen/actions"

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const recentInvoices = await getRecentInvoices(5)
  return (
    <div className="space-y-6">
      {/* Header met snelle acties */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welkom terug!</h2>
          <p className="text-muted-foreground">
            Hier is een overzicht van je facturatie
          </p>
        </div>
        <Button asChild>
          <Link href="/facturen/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Factuur
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Openstaand"
          value={formatCurrency(stats.totalOutstanding)}
          description={`${stats.invoiceCount} facturen`}
          icon={Euro}
        />
        <StatsCard
          title="Achterstallig"
          value={formatCurrency(stats.overdueAmount)}
          description={`${stats.overdueCount} facturen`}
          icon={AlertTriangle}
          className={stats.overdueCount > 0 ? "border-red-200 bg-red-50" : ""}
        />
        <StatsCard
          title="Omzet deze maand"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={FileText}
        />
        <StatsCard
          title="Klanten"
          value={stats.customerCount.toString()}
          icon={Users}
        />
      </div>

      {/* Recente facturen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recente Facturen</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/facturen">Bekijk alle</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nog geen facturen
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

        {/* Snelle acties */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/facturen/nieuw">
                <FileText className="mr-2 h-4 w-4" />
                Nieuwe factuur maken
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/klanten/nieuw">
                <Users className="mr-2 h-4 w-4" />
                Nieuwe klant toevoegen
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/producten">
                <Plus className="mr-2 h-4 w-4" />
                Product/dienst beheren
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Omzet overzicht */}
      <Card>
        <CardHeader>
          <CardTitle>Omzet {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(stats.revenueThisYear)}
          </div>
          <p className="text-sm text-muted-foreground">
            Totale omzet dit jaar (betaalde facturen)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
