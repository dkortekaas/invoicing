import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import {
  Calculator,
  TrendingUp,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react"

import { getCurrentUser } from "@/lib/get-session"
import { requireFeature } from "@/lib/auth/subscription-guard"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchAvailableYears, fetchExistingReports } from "./actions"
import { GenerateReportButton } from "./generate-report-button"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Concept",
  PROVISIONAL: "Voorlopig",
  FINAL: "Definitief",
  FILED: "Ingediend",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  PROVISIONAL: "secondary",
  FINAL: "default",
  FILED: "default",
}

export default async function BelastingPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  await requireFeature("tax_reporting")

  const [availableYears, existingReports] = await Promise.all([
    fetchAvailableYears(),
    fetchExistingReports(),
  ])

  const currentYear = new Date().getFullYear()
  const reportMap = new Map(existingReports.map(r => [r.year, r]))

  // Get most recent report for summary
  const latestReport = existingReports[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Inkomstenbelasting
          </h2>
          <p className="text-muted-foreground">
            Jaarlijkse belastingrapporten en aftrekposten
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {latestReport && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Netto omzet {latestReport.year}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(latestReport.revenueNet)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bruto winst {latestReport.year}
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(latestReport.grossProfit)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Belastbaar inkomen
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(latestReport.taxableProfit)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Geschatte belasting
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(latestReport.estimatedTaxBox1)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Jaarrapporten</CardTitle>
          <CardDescription>
            Overzicht van alle belastingrapporten per jaar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Geen gegevens beschikbaar</h3>
              <p className="text-muted-foreground mb-4">
                Er zijn nog geen betaalde facturen om een rapport van te
                genereren.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jaar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Netto omzet</TableHead>
                  <TableHead className="text-right">Bruto winst</TableHead>
                  <TableHead className="text-right">Belastbaar</TableHead>
                  <TableHead className="text-right">Geschatte belasting</TableHead>
                  <TableHead className="text-right">Laatst bijgewerkt</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableYears.map((year) => {
                  const report = reportMap.get(year)
                  return (
                    <TableRow key={year}>
                      <TableCell className="font-medium">
                        {year}
                        {year === currentYear && (
                          <Badge variant="outline" className="ml-2">
                            Huidig
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {report ? (
                          <Badge variant={STATUS_VARIANTS[report.status]}>
                            {STATUS_LABELS[report.status]}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Niet gegenereerd</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {report ? formatCurrency(report.revenueNet) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {report ? formatCurrency(report.grossProfit) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {report ? formatCurrency(report.taxableProfit) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {report ? formatCurrency(report.estimatedTaxBox1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {report
                          ? format(new Date(report.updatedAt), "d MMM yyyy", {
                              locale: nl,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {report ? (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/belasting/${year}`}>
                              Bekijken
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <GenerateReportButton year={year} />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fiscale instellingen</CardTitle>
            <CardDescription>
              Configureer je urencriterium, startersaftrek en andere fiscale
              opties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/instellingen?tab=fiscaal">
                Naar instellingen
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bedrijfsmiddelen</CardTitle>
            <CardDescription>
              Beheer je activa en bekijk afschrijvingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/activa">
                Naar bedrijfsmiddelen
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
