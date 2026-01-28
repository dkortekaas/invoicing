"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUserId } from "@/lib/server-utils"
import {
  generateTaxReport,
  saveTaxReport,
  getAvailableYears,
  getExistingReports,
  getTaxReport,
  updateTaxReportStatus,
} from "@/lib/tax"

// Get available years for tax reports
export async function fetchAvailableYears() {
  const userId = await getCurrentUserId()
  return getAvailableYears(userId)
}

// Get existing reports
export async function fetchExistingReports() {
  const userId = await getCurrentUserId()
  const reports = await getExistingReports(userId)

  return reports.map(report => ({
    ...report,
    revenueNet: report.revenueNet.toNumber(),
    grossProfit: report.grossProfit.toNumber(),
    taxableProfit: report.taxableProfit.toNumber(),
    estimatedTaxBox1: report.estimatedTaxBox1.toNumber(),
  }))
}

// Get a specific report
export async function fetchTaxReport(year: number) {
  const userId = await getCurrentUserId()
  const report = await getTaxReport(userId, year)

  if (!report) {
    return null
  }

  return {
    ...report,
    revenueGross: report.revenueGross.toNumber(),
    creditNotesTotal: report.creditNotesTotal.toNumber(),
    revenueNet: report.revenueNet.toNumber(),
    expensesTransport: report.expensesTransport.toNumber(),
    expensesHousing: report.expensesHousing.toNumber(),
    expensesGeneral: report.expensesGeneral.toNumber(),
    expensesOffice: report.expensesOffice.toNumber(),
    expensesOutsourced: report.expensesOutsourced.toNumber(),
    expensesRepresentation: report.expensesRepresentation.toNumber(),
    expensesOther: report.expensesOther.toNumber(),
    expensesTotal: report.expensesTotal.toNumber(),
    depreciationTotal: report.depreciationTotal.toNumber(),
    grossProfit: report.grossProfit.toNumber(),
    kiaAmount: report.kiaAmount.toNumber(),
    kiaInvestments: report.kiaInvestments.toNumber(),
    zelfstandigenaftrek: report.zelfstandigenaftrek.toNumber(),
    startersaftrek: report.startersaftrek.toNumber(),
    forDotation: report.forDotation.toNumber(),
    profitBeforeMKB: report.profitBeforeMKB.toNumber(),
    mkbVrijstelling: report.mkbVrijstelling.toNumber(),
    taxableProfit: report.taxableProfit.toNumber(),
    estimatedTaxBox1: report.estimatedTaxBox1.toNumber(),
  }
}

// Generate a new report for a year
export async function generateReport(year: number, hoursOverride?: number) {
  const userId = await getCurrentUserId()

  const report = await generateTaxReport({
    userId,
    year,
    hoursOverride,
  })

  // Save to database
  await saveTaxReport(userId, year, report)

  revalidatePath("/belasting")
  revalidatePath(`/belasting/${year}`)

  return report
}

// Update report status
export async function setReportStatus(
  year: number,
  status: 'DRAFT' | 'PROVISIONAL' | 'FINAL' | 'FILED'
) {
  const userId = await getCurrentUserId()

  await updateTaxReportStatus(userId, year, status)

  revalidatePath("/belasting")
  revalidatePath(`/belasting/${year}`)
}
