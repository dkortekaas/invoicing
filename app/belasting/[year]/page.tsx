import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import {
  ChevronLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Calculator,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react"

import { getCurrentUser } from "@/lib/get-session"
import { requireFeature } from "@/lib/auth/subscription-guard"
import { formatCurrency } from "@/lib/utils"
import { TAX_RATES_2026 } from "@/lib/tax/rates"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { fetchTaxReport, generateReport } from "../actions"
import { RefreshReportButton } from "./refresh-button"
import { StatusSelector } from "./status-selector"

interface BelastingJaarPageProps {
  params: Promise<{ year: string }>
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Concept",
  PROVISIONAL: "Voorlopig",
  FINAL: "Definitief",
  FILED: "Ingediend",
}

export default async function BelastingJaarPage({
  params,
}: BelastingJaarPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  await requireFeature("tax_reporting")

  const { year: yearStr } = await params
  const year = parseInt(yearStr, 10)

  if (isNaN(year) || year < 2000 || year > 2100) {
    notFound()
  }

  let report = await fetchTaxReport(year)

  // If no report exists, generate one
  if (!report) {
    await generateReport(year)
    report = await fetchTaxReport(year)
  }

  if (!report) {
    notFound()
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/belasting">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Belastingjaar {year}
                </h2>
                <Badge
                  variant={
                    report.status === "FILED" || report.status === "FINAL"
                      ? "default"
                      : "outline"
                  }
                >
                  {STATUS_LABELS[report.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Laatst bijgewerkt:{" "}
                {format(new Date(report.updatedAt), "d MMMM yyyy HH:mm", {
                  locale: nl,
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshReportButton year={year} />
            <StatusSelector year={year} currentStatus={report.status} />
            <Button asChild>
              <Link href={`/api/tax/report/${year}/export`}>
                <Download className="mr-2 h-4 w-4" />
                Exporteren
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Netto omzet</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.revenueNet)}
              </div>
              {report.creditNotesTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Minus {formatCurrency(report.creditNotesTotal)} credit nota&apos;s
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bruto winst</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.grossProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Na kosten en afschrijvingen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Belastbaar inkomen
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.taxableProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Na alle aftrekposten
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Geschatte belasting
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(report.estimatedTaxBox1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Box 1 inkomstenbelasting
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hours Criterion Status */}
        {report.hoursWorked !== null && (
          <Card
            className={
              report.meetsHoursCriterion
                ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                : "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {report.meetsHoursCriterion ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Clock className="h-8 w-8 text-amber-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {report.meetsHoursCriterion
                      ? "Je voldoet aan het urencriterium"
                      : "Je voldoet niet aan het urencriterium"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {report.hoursWorked} uur geregistreerd (minimaal{" "}
                    {TAX_RATES_2026.hoursCriterionMin} uur vereist)
                    {!report.meetsHoursCriterion && (
                      <span>
                        {" "}
                        - nog{" "}
                        {TAX_RATES_2026.hoursCriterionMin - report.hoursWorked}{" "}
                        uur nodig
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue & Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Omzet en kosten</CardTitle>
              <CardDescription>Overzicht van inkomsten en uitgaven</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Bruto omzet</span>
                  <span className="font-medium">
                    {formatCurrency(report.revenueGross)}
                  </span>
                </div>
                {report.creditNotesTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Credit nota&apos;s</span>
                    <span>-{formatCurrency(report.creditNotesTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Netto omzet</span>
                  <span>{formatCurrency(report.revenueNet)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Kosten per categorie</h4>
                {report.expensesTransport > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vervoerskosten</span>
                    <span>-{formatCurrency(report.expensesTransport)}</span>
                  </div>
                )}
                {report.expensesHousing > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Huisvestingskosten
                    </span>
                    <span>-{formatCurrency(report.expensesHousing)}</span>
                  </div>
                )}
                {report.expensesGeneral > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Algemene kosten</span>
                    <span>-{formatCurrency(report.expensesGeneral)}</span>
                  </div>
                )}
                {report.expensesOffice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kantoorkosten</span>
                    <span>-{formatCurrency(report.expensesOffice)}</span>
                  </div>
                )}
                {report.expensesOutsourced > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uitbesteed werk</span>
                    <span>-{formatCurrency(report.expensesOutsourced)}</span>
                  </div>
                )}
                {report.expensesRepresentation > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Representatiekosten
                    </span>
                    <span>-{formatCurrency(report.expensesRepresentation)}</span>
                  </div>
                )}
                {report.expensesOther > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overige kosten</span>
                    <span>-{formatCurrency(report.expensesOther)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Totaal kosten</span>
                  <span>-{formatCurrency(report.expensesTotal)}</span>
                </div>
              </div>

              {report.depreciationTotal > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Afschrijvingen</span>
                    <span>-{formatCurrency(report.depreciationTotal)}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Bruto winst</span>
                <span>{formatCurrency(report.grossProfit)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>Aftrekposten</CardTitle>
              <CardDescription>
                Ondernemersaftrekken en investeringsaftrek
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Bruto winst</span>
                  <span className="font-medium">
                    {formatCurrency(report.grossProfit)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {/* KIA */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span>Kleinschaligheidsinvesteringsaftrek (KIA)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Bij investeringen tussen €{TAX_RATES_2026.kia.minInvestment.toLocaleString()} en
                          €{TAX_RATES_2026.kia.maxInvestment.toLocaleString()} krijg je een extra aftrek.
                          Jouw investeringen: {formatCurrency(report.kiaInvestments)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span
                    className={
                      report.kiaAmount > 0 ? "text-green-600" : "text-muted-foreground"
                    }
                  >
                    {report.kiaAmount > 0
                      ? `-${formatCurrency(report.kiaAmount)}`
                      : "-"}
                  </span>
                </div>

                {/* Zelfstandigenaftrek */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span>Zelfstandigenaftrek</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          €{TAX_RATES_2026.zelfstandigenaftrek.toLocaleString()} aftrek als je voldoet aan het
                          urencriterium (minimaal {TAX_RATES_2026.hoursCriterionMin} uur).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span
                    className={
                      report.zelfstandigenaftrek > 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {report.zelfstandigenaftrek > 0
                      ? `-${formatCurrency(report.zelfstandigenaftrek)}`
                      : "-"}
                  </span>
                </div>

                {/* Startersaftrek */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span>Startersaftrek</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Extra €{TAX_RATES_2026.startersaftrek.toLocaleString()} aftrek voor starters, maximaal 3
                          jaar.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span
                    className={
                      report.startersaftrek > 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {report.startersaftrek > 0
                      ? `-${formatCurrency(report.startersaftrek)}`
                      : "-"}
                  </span>
                </div>

                {/* FOR */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span>Fiscale Oudedagsreserve (FOR)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Maximaal {TAX_RATES_2026.for.maxPercentage}% van de winst (max. €
                          {TAX_RATES_2026.for.maxAmount.toLocaleString()}) reserveren voor pensioen.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span
                    className={
                      report.forDotation > 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {report.forDotation > 0
                      ? `-${formatCurrency(report.forDotation)}`
                      : "-"}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Winst voor MKB-vrijstelling</span>
                <span className="font-medium">
                  {formatCurrency(report.profitBeforeMKB)}
                </span>
              </div>

              {/* MKB Vrijstelling */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span>MKB-winstvrijstelling</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        {TAX_RATES_2026.mkbVrijstellingPercentage}% van de winst na aftrekposten is
                        vrijgesteld. Alleen bij urencriterium.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span
                  className={
                    report.mkbVrijstelling > 0
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }
                >
                  {report.mkbVrijstelling > 0
                    ? `-${formatCurrency(report.mkbVrijstelling)}`
                    : "-"}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Belastbaar inkomen</span>
                <span>{formatCurrency(report.taxableProfit)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold text-destructive pt-2 border-t">
                <span>Geschatte belasting Box 1</span>
                <span>{formatCurrency(report.estimatedTaxBox1)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Disclaimer</p>
                <p>
                  Dit is een indicatieve berekening. De daadwerkelijke belasting
                  kan afwijken door persoonlijke omstandigheden, andere
                  inkomsten, heffingskortingen en wijzigingen in belastingtarieven.
                  Raadpleeg een belastingadviseur voor je officiële aangifte.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
