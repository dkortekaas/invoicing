import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { nl, enUS } from "date-fns/locale"
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
import { getAppLocale, getServerT } from "@/lib/i18n"
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
import { T } from "@/components/t"
import { fetchTaxReport, generateReport } from "../actions"
import { RefreshReportButton } from "./refresh-button"
import { StatusSelector } from "./status-selector"

interface BelastingJaarPageProps {
  params: Promise<{ year: string }>
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

  const locale = await getAppLocale()
  const dateLocale = locale === "en" ? enUS : nl
  const t = await getServerT("taxPage")
  const STATUS_LABELS: Record<string, string> = {
    DRAFT: t("statusDraft"),
    PROVISIONAL: t("statusProvisional"),
    FINAL: t("statusFinal"),
    FILED: t("statusFiled"),
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
                  <T ns="taxPage" k="yearDetail.taxYear" /> {year}
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
                <T ns="taxPage" k="yearDetail.lastUpdated" />{" "}
                {format(new Date(report.updatedAt), "d MMMM yyyy HH:mm", {
                  locale: dateLocale,
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
                <T ns="taxPage" k="yearDetail.export" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <T ns="taxPage" k="yearDetail.netRevenue" />
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.revenueNet)}
              </div>
              {report.creditNotesTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  <T ns="taxPage" k="yearDetail.minusCreditNotes" vars={{ amount: formatCurrency(report.creditNotesTotal) }} />
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <T ns="taxPage" k="yearDetail.grossProfit" />
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.grossProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                <T ns="taxPage" k="yearDetail.afterCostsDepreciation" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <T ns="taxPage" k="yearDetail.taxableIncome" />
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.taxableProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                <T ns="taxPage" k="yearDetail.afterAllDeductions" />
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <T ns="taxPage" k="yearDetail.estimatedTax" />
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(report.estimatedTaxBox1)}
              </div>
              <p className="text-xs text-muted-foreground">
                <T ns="taxPage" k="yearDetail.box1IncomeTax" />
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
            <CardContent>
              <div className="flex items-center gap-4">
                {report.meetsHoursCriterion ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Clock className="h-8 w-8 text-amber-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {report.meetsHoursCriterion ? (
                      <T ns="taxPage" k="yearDetail.meetsHoursCriterion" />
                    ) : (
                      <T ns="taxPage" k="yearDetail.notMeetsHoursCriterion" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <T
                      ns="taxPage"
                      k="yearDetail.hoursRegistered"
                      vars={{
                        hours: String(report.hoursWorked),
                        min: String(TAX_RATES_2026.hoursCriterionMin),
                      }}
                    />
                    {!report.meetsHoursCriterion && (
                      <span>
                        {" "}
                        -{" "}
                        <T
                          ns="taxPage"
                          k="yearDetail.moreHoursNeeded"
                          vars={{
                            hours: String(TAX_RATES_2026.hoursCriterionMin - report.hoursWorked),
                          }}
                        />
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
              <CardTitle><T ns="taxPage" k="yearDetail.revenueAndExpenses" /></CardTitle>
              <CardDescription>
                <T ns="taxPage" k="yearDetail.revenueExpensesDescription" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span><T ns="taxPage" k="yearDetail.grossRevenue" /></span>
                  <span className="font-medium">
                    {formatCurrency(report.revenueGross)}
                  </span>
                </div>
                {report.creditNotesTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span><T ns="taxPage" k="yearDetail.creditNotes" /></span>
                    <span>-{formatCurrency(report.creditNotesTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span><T ns="taxPage" k="yearDetail.netRevenueLabel" /></span>
                  <span>{formatCurrency(report.revenueNet)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">
                  <T ns="taxPage" k="yearDetail.costsByCategory" />
                </h4>
                {report.expensesTransport > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.transportCosts" />
                    </span>
                    <span>-{formatCurrency(report.expensesTransport)}</span>
                  </div>
                )}
                {report.expensesHousing > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.housingCosts" />
                    </span>
                    <span>-{formatCurrency(report.expensesHousing)}</span>
                  </div>
                )}
                {report.expensesGeneral > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.generalCosts" />
                    </span>
                    <span>-{formatCurrency(report.expensesGeneral)}</span>
                  </div>
                )}
                {report.expensesOffice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.officeCosts" />
                    </span>
                    <span>-{formatCurrency(report.expensesOffice)}</span>
                  </div>
                )}
                {report.expensesOutsourced > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.outsourcedWork" />
                    </span>
                    <span>-{formatCurrency(report.expensesOutsourced)}</span>
                  </div>
                )}
                {report.expensesRepresentation > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.representationCosts" />
                    </span>
                    <span>-{formatCurrency(report.expensesRepresentation)}</span>
                  </div>
                )}
                {report.expensesOther > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <T ns="taxPage" k="yearDetail.otherCosts" />
                    </span>
                    <span>-{formatCurrency(report.expensesOther)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span><T ns="taxPage" k="yearDetail.totalCosts" /></span>
                  <span>-{formatCurrency(report.expensesTotal)}</span>
                </div>
              </div>

              {report.depreciationTotal > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span><T ns="taxPage" k="yearDetail.depreciation" /></span>
                    <span>-{formatCurrency(report.depreciationTotal)}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span><T ns="taxPage" k="yearDetail.grossProfitLabel" /></span>
                <span>{formatCurrency(report.grossProfit)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle><T ns="taxPage" k="yearDetail.deductions" /></CardTitle>
              <CardDescription>
                <T ns="taxPage" k="yearDetail.deductionsDescription" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span><T ns="taxPage" k="yearDetail.grossProfitLabel2" /></span>
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
                    <span><T ns="taxPage" k="yearDetail.kia" /></span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          <T
                            ns="taxPage"
                            k="yearDetail.kiaTooltip"
                            vars={{
                              min: TAX_RATES_2026.kia.minInvestment.toLocaleString(),
                              max: TAX_RATES_2026.kia.maxInvestment.toLocaleString(),
                              amount: formatCurrency(report.kiaInvestments),
                            }}
                          />
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
                    <span><T ns="taxPage" k="yearDetail.zelfstandigenaftrek" /></span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          <T
                            ns="taxPage"
                            k="yearDetail.zelfstandigenaftrekTooltip"
                            vars={{
                              amount: TAX_RATES_2026.zelfstandigenaftrek.toLocaleString(),
                              hours: String(TAX_RATES_2026.hoursCriterionMin),
                            }}
                          />
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
                    <span><T ns="taxPage" k="yearDetail.startersaftrek" /></span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          <T
                            ns="taxPage"
                            k="yearDetail.startersaftrekTooltip"
                            vars={{
                              amount: TAX_RATES_2026.startersaftrek.toLocaleString(),
                            }}
                          />
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
                    <span><T ns="taxPage" k="yearDetail.for" /></span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          <T
                            ns="taxPage"
                            k="yearDetail.forTooltip"
                            vars={{
                              percentage: String(TAX_RATES_2026.for.maxPercentage),
                              max: TAX_RATES_2026.for.maxAmount.toLocaleString(),
                            }}
                          />
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
                <span><T ns="taxPage" k="yearDetail.profitBeforeMKB" /></span>
                <span className="font-medium">
                  {formatCurrency(report.profitBeforeMKB)}
                </span>
              </div>

              {/* MKB Vrijstelling */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span><T ns="taxPage" k="yearDetail.mkbExemption" /></span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        <T
                          ns="taxPage"
                          k="yearDetail.mkbTooltip"
                          vars={{
                            percentage: String(TAX_RATES_2026.mkbVrijstellingPercentage),
                          }}
                        />
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
                <span><T ns="taxPage" k="yearDetail.taxableIncomeLabel" /></span>
                <span>{formatCurrency(report.taxableProfit)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold text-destructive pt-2 border-t">
                <span><T ns="taxPage" k="yearDetail.estimatedTaxBox1" /></span>
                <span>{formatCurrency(report.estimatedTaxBox1)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">
                  <T ns="taxPage" k="yearDetail.disclaimer" />
                </p>
                <p>
                  <T ns="taxPage" k="yearDetail.disclaimerText" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
