/**
 * Generator voor jaarlijkse belastingrapporten
 */

import { db } from '@/lib/db';
import { calculateTaxReport, TaxReportInput, TaxReportResult } from './calculations';
import { groupExpensesByTaxCategory } from './expense-mapping';
import {
  calculateTotalDepreciationForYear,
  calculateKIAInvestments,
} from './depreciation';

export interface GenerateTaxReportOptions {
  userId: string;
  year: number;
  hoursOverride?: number; // Optioneel: handmatig ingevoerde uren
}

/**
 * Genereer een belastingrapport voor een bepaald jaar
 */
export async function generateTaxReport(
  options: GenerateTaxReportOptions
): Promise<TaxReportResult & { year: number }> {
  const { userId, year, hoursOverride } = options;

  // Haal fiscale instellingen op
  const fiscalSettings = await db.fiscalSettings.findUnique({
    where: { userId },
  });

  // Datum bereik voor het jaar
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  // Haal omzet op (verstuurde/betaalde facturen in het jaar op basis van factuurdatum)
  // Dit volgt het factuurstelsel: omzet wordt toegerekend aan het jaar van de factuur
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      status: { in: ['SENT', 'PAID', 'OVERDUE'] },
      invoiceDate: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    select: {
      total: true,
      vatAmount: true,
    },
  });

  const revenueGross = invoices.reduce(
    (sum, inv) => sum + (inv.total.toNumber() - inv.vatAmount.toNumber()),
    0
  );

  // Haal credit nota's op
  const creditNotes = await db.creditNote.findMany({
    where: {
      userId,
      status: { in: ['FINAL', 'SENT', 'PROCESSED', 'REFUNDED'] },
      creditNoteDate: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    select: {
      total: true,
      vatAmount: true,
    },
  });

  const creditNotesTotal = creditNotes.reduce(
    (sum, cn) => sum + (cn.total.toNumber() - cn.vatAmount.toNumber()),
    0
  );

  // Haal kosten op voor inkomstenbelasting
  // Let op: het 'deductible' veld gaat over BTW-aftrek, niet over inkomstenbelasting!
  // Voor IB zijn ALLE zakelijke kosten aftrekbaar (ook bij KOR waar je geen BTW aftrekt)
  const expenses = await db.expense.findMany({
    where: {
      userId,
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    select: {
      category: true,
      netAmount: true,
    },
  });

  // Voor inkomstenbelasting: gebruik het volledige netto bedrag van alle kosten
  const deductibleExpenses = expenses.map(exp => ({
    category: exp.category,
    netAmount: exp.netAmount.toNumber(),
  }));

  const expensesByCategory = groupExpensesByTaxCategory(deductibleExpenses);

  // Haal activa op voor afschrijvingen
  const assets = await db.asset.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      purchasePrice: true,
      residualValue: true,
      usefulLifeYears: true,
      purchaseDate: true,
      depreciationMethod: true,
      disposalDate: true,
      kiaApplied: true,
    },
  });

  const assetsForCalculation = assets.map(asset => ({
    purchasePrice: asset.purchasePrice.toNumber(),
    residualValue: asset.residualValue.toNumber(),
    usefulLifeYears: asset.usefulLifeYears,
    purchaseDate: asset.purchaseDate,
    depreciationMethod: asset.depreciationMethod,
    isActive: true,
    disposalDate: asset.disposalDate,
    kiaApplied: asset.kiaApplied,
  }));

  const depreciationTotal = calculateTotalDepreciationForYear(
    assetsForCalculation,
    year
  );

  const kiaInvestments = calculateKIAInvestments(assetsForCalculation, year);

  // Bereken gewerkte uren
  let hoursWorked = 0;

  if (hoursOverride !== undefined) {
    hoursWorked = hoursOverride;
  } else if (fiscalSettings?.hoursTracked) {
    // Haal uren uit tijdregistratie
    const timeEntries = await db.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: {
        duration: true,
      },
    });

    hoursWorked = timeEntries.reduce(
      (sum, entry) => sum + entry.duration.toNumber(),
      0
    );
  } else if (fiscalSettings?.manualHoursPerYear) {
    hoursWorked = fiscalSettings.manualHoursPerYear;
  }

  // Stel input samen
  const input: TaxReportInput = {
    revenueGross,
    creditNotesTotal,
    expenses: expensesByCategory,
    depreciationTotal,
    kiaInvestments,
    hoursWorked: Math.round(hoursWorked),
    isStarter: fiscalSettings?.isStarter ?? false,
    starterYearsUsed: fiscalSettings?.starterYearsUsed ?? 0,
    useFOR: fiscalSettings?.useFOR ?? false,
  };

  // Bereken rapport
  const result = calculateTaxReport(input);

  return {
    ...result,
    year,
  };
}

/**
 * Sla een belastingrapport op in de database
 */
export async function saveTaxReport(
  userId: string,
  year: number,
  report: TaxReportResult
) {
  const data = {
    userId,
    year,
    status: 'DRAFT' as const,
    revenueGross: report.revenueGross,
    creditNotesTotal: report.creditNotesTotal,
    revenueNet: report.revenueNet,
    expensesTransport: report.expensesTransport,
    expensesHousing: report.expensesHousing,
    expensesGeneral: report.expensesGeneral,
    expensesOffice: report.expensesOffice,
    expensesOutsourced: report.expensesOutsourced,
    expensesRepresentation: report.expensesRepresentation,
    expensesOther: report.expensesOther,
    expensesTotal: report.expensesTotal,
    depreciationTotal: report.depreciationTotal,
    grossProfit: report.grossProfit,
    kiaAmount: report.kiaAmount,
    kiaInvestments: report.kiaInvestments,
    zelfstandigenaftrek: report.zelfstandigenaftrek,
    startersaftrek: report.startersaftrek,
    forDotation: report.forDotation,
    profitBeforeMKB: report.profitBeforeMKB,
    mkbVrijstelling: report.mkbVrijstelling,
    taxableProfit: report.taxableProfit,
    estimatedTaxBox1: report.estimatedTaxBox1,
    hoursWorked: report.hoursWorked,
    meetsHoursCriterion: report.meetsHoursCriterion,
    generatedAt: new Date(),
  };

  // Upsert: update als bestaat, anders aanmaken
  return db.taxReport.upsert({
    where: {
      userId_year: {
        userId,
        year,
      },
    },
    create: data,
    update: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Haal beschikbare jaren op voor belastingrapporten
 * Kijkt naar alle data bronnen: facturen, kosten, credit nota's, tijdregistratie, activa
 */
export async function getAvailableYears(userId: string): Promise<number[]> {
  const currentYear = new Date().getFullYear();

  // Haal eerste data op uit alle bronnen parallel
  const [firstInvoice, firstExpense, firstCreditNote, firstTimeEntry, firstAsset] = await Promise.all([
    // Eerste factuur (alle statussen behalve DRAFT)
    db.invoice.findFirst({
      where: {
        userId,
        status: { not: 'DRAFT' },
      },
      orderBy: {
        invoiceDate: 'asc',
      },
      select: {
        invoiceDate: true,
      },
    }),
    // Eerste kosten
    db.expense.findFirst({
      where: { userId },
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
      },
    }),
    // Eerste credit nota
    db.creditNote.findFirst({
      where: {
        userId,
        status: { not: 'DRAFT' },
      },
      orderBy: {
        creditNoteDate: 'asc',
      },
      select: {
        creditNoteDate: true,
      },
    }),
    // Eerste tijdregistratie
    db.timeEntry.findFirst({
      where: { userId },
      orderBy: {
        startTime: 'asc',
      },
      select: {
        startTime: true,
      },
    }),
    // Eerste activum
    db.asset.findFirst({
      where: { userId },
      orderBy: {
        purchaseDate: 'asc',
      },
      select: {
        purchaseDate: true,
      },
    }),
  ]);

  // Verzamel alle jaren
  const years: number[] = [];

  if (firstInvoice?.invoiceDate) {
    years.push(firstInvoice.invoiceDate.getFullYear());
  }
  if (firstExpense?.date) {
    years.push(firstExpense.date.getFullYear());
  }
  if (firstCreditNote?.creditNoteDate) {
    years.push(firstCreditNote.creditNoteDate.getFullYear());
  }
  if (firstTimeEntry?.startTime) {
    years.push(firstTimeEntry.startTime.getFullYear());
  }
  if (firstAsset?.purchaseDate) {
    years.push(firstAsset.purchaseDate.getFullYear());
  }

  // Als geen data, return huidig jaar
  if (years.length === 0) {
    return [currentYear];
  }

  // Vind het vroegste jaar
  const firstYear = Math.min(...years);

  // Genereer alle jaren van eerste tot huidig
  const result: number[] = [];
  for (let year = firstYear; year <= currentYear; year++) {
    result.push(year);
  }

  return result;
}

/**
 * Haal bestaande rapporten op
 */
export async function getExistingReports(userId: string) {
  return db.taxReport.findMany({
    where: { userId },
    orderBy: { year: 'desc' },
    select: {
      id: true,
      year: true,
      status: true,
      revenueNet: true,
      grossProfit: true,
      taxableProfit: true,
      estimatedTaxBox1: true,
      generatedAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Haal een specifiek rapport op
 */
export async function getTaxReport(userId: string, year: number) {
  return db.taxReport.findUnique({
    where: {
      userId_year: {
        userId,
        year,
      },
    },
  });
}

/**
 * Update rapport status
 */
export async function updateTaxReportStatus(
  userId: string,
  year: number,
  status: 'DRAFT' | 'PROVISIONAL' | 'FINAL' | 'FILED'
) {
  return db.taxReport.update({
    where: {
      userId_year: {
        userId,
        year,
      },
    },
    data: { status },
  });
}
