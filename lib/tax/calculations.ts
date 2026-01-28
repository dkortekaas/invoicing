/**
 * Kernberekeningen voor inkomstenbelasting
 */

import { TaxExpenseCategory } from './expense-mapping';
import {
  calculateKIA,
  calculateZelfstandigenaftrek,
  calculateStartersaftrek,
  calculateFORDotation,
  calculateMKBVrijstelling,
  calculateEstimatedTax,
  meetsHoursCriterion,
  TAX_RATES_2026,
} from './rates';

export interface TaxReportInput {
  // Omzet
  revenueGross: number;
  creditNotesTotal: number;

  // Kosten per categorie
  expenses: Record<TaxExpenseCategory, number>;

  // Afschrijvingen
  depreciationTotal: number;

  // Investeringen voor KIA
  kiaInvestments: number;

  // Fiscale instellingen
  hoursWorked: number;
  isStarter: boolean;
  starterYearsUsed: number;
  useFOR: boolean;
}

export interface TaxReportResult {
  // Omzet
  revenueGross: number;
  creditNotesTotal: number;
  revenueNet: number;

  // Kosten
  expensesTransport: number;
  expensesHousing: number;
  expensesGeneral: number;
  expensesOffice: number;
  expensesOutsourced: number;
  expensesRepresentation: number;
  expensesOther: number;
  expensesTotal: number;

  // Afschrijvingen
  depreciationTotal: number;

  // Bruto winst
  grossProfit: number;

  // Aftrekposten
  kiaAmount: number;
  kiaInvestments: number;
  zelfstandigenaftrek: number;
  startersaftrek: number;
  forDotation: number;

  // Eindberekening
  profitBeforeMKB: number;
  mkbVrijstelling: number;
  taxableProfit: number;
  estimatedTaxBox1: number;

  // Uren
  hoursWorked: number;
  meetsHoursCriterion: boolean;
}

/**
 * Bereken volledig belastingoverzicht
 */
export function calculateTaxReport(input: TaxReportInput): TaxReportResult {
  // Netto omzet
  const revenueNet = input.revenueGross - input.creditNotesTotal;

  // Kosten uit input
  const expensesTransport = input.expenses.TRANSPORT || 0;
  const expensesHousing = input.expenses.HOUSING || 0;
  const expensesGeneral = input.expenses.GENERAL || 0;
  const expensesOffice = input.expenses.OFFICE || 0;
  const expensesOutsourced = input.expenses.OUTSOURCED || 0;
  const expensesRepresentation = input.expenses.REPRESENTATION || 0;
  const expensesOther = input.expenses.OTHER || 0;

  const expensesTotal =
    expensesTransport +
    expensesHousing +
    expensesGeneral +
    expensesOffice +
    expensesOutsourced +
    expensesRepresentation +
    expensesOther;

  // Bruto winst
  const grossProfit = revenueNet - expensesTotal - input.depreciationTotal;

  // Controleer urencriterium
  const meetsHours = meetsHoursCriterion(input.hoursWorked);

  // Bereken aftrekposten
  const kiaAmount = calculateKIA(input.kiaInvestments);
  const zelfstandigenaftrek = calculateZelfstandigenaftrek(meetsHours);
  const startersaftrek = calculateStartersaftrek(
    meetsHours,
    input.isStarter,
    input.starterYearsUsed
  );

  // FOR alleen berekenen als winst positief is
  const profitForFOR = grossProfit - kiaAmount - zelfstandigenaftrek - startersaftrek;
  const forDotation = calculateFORDotation(profitForFOR, input.useFOR);

  // Winst voor MKB-vrijstelling
  const profitBeforeMKB = Math.max(
    0,
    grossProfit - kiaAmount - zelfstandigenaftrek - startersaftrek - forDotation
  );

  // MKB-vrijstelling alleen als aan urencriterium voldaan
  const mkbVrijstelling = meetsHours
    ? calculateMKBVrijstelling(profitBeforeMKB)
    : 0;

  // Belastbaar inkomen
  const taxableProfit = Math.max(0, profitBeforeMKB - mkbVrijstelling);

  // Geschatte belasting
  const estimatedTaxBox1 = calculateEstimatedTax(taxableProfit);

  return {
    // Omzet
    revenueGross: round(input.revenueGross),
    creditNotesTotal: round(input.creditNotesTotal),
    revenueNet: round(revenueNet),

    // Kosten
    expensesTransport: round(expensesTransport),
    expensesHousing: round(expensesHousing),
    expensesGeneral: round(expensesGeneral),
    expensesOffice: round(expensesOffice),
    expensesOutsourced: round(expensesOutsourced),
    expensesRepresentation: round(expensesRepresentation),
    expensesOther: round(expensesOther),
    expensesTotal: round(expensesTotal),

    // Afschrijvingen
    depreciationTotal: round(input.depreciationTotal),

    // Bruto winst
    grossProfit: round(grossProfit),

    // Aftrekposten
    kiaAmount: round(kiaAmount),
    kiaInvestments: round(input.kiaInvestments),
    zelfstandigenaftrek: round(zelfstandigenaftrek),
    startersaftrek: round(startersaftrek),
    forDotation: round(forDotation),

    // Eindberekening
    profitBeforeMKB: round(profitBeforeMKB),
    mkbVrijstelling: round(mkbVrijstelling),
    taxableProfit: round(taxableProfit),
    estimatedTaxBox1: round(estimatedTaxBox1),

    // Uren
    hoursWorked: input.hoursWorked,
    meetsHoursCriterion: meetsHours,
  };
}

/**
 * Bereken het effectieve belastingpercentage
 */
export function calculateEffectiveTaxRate(
  taxableProfit: number,
  estimatedTax: number
): number {
  if (taxableProfit <= 0) {
    return 0;
  }

  return Math.round((estimatedTax / taxableProfit) * 10000) / 100;
}

/**
 * Bereken bespaarde belasting door aftrekposten
 */
export function calculateTaxSavings(
  grossProfit: number,
  taxableProfit: number
): number {
  const taxWithoutDeductions = calculateEstimatedTax(grossProfit);
  const taxWithDeductions = calculateEstimatedTax(taxableProfit);

  return Math.round(taxWithoutDeductions - taxWithDeductions);
}

/**
 * Bereken hoeveel extra uren nodig zijn voor urencriterium
 */
export function hoursNeededForCriterion(currentHours: number): number {
  const needed = TAX_RATES_2026.hoursCriterionMin - currentHours;
  return Math.max(0, needed);
}

/**
 * Bereken potentieel voordeel van urencriterium
 */
export function calculateHoursCriterionBenefit(
  isStarter: boolean,
  starterYearsUsed: number,
  grossProfit: number
): {
  zelfstandigenaftrek: number;
  startersaftrek: number;
  mkbVrijstelling: number;
  totalBenefit: number;
  taxSavings: number;
} {
  const zelfstandigenaftrek = TAX_RATES_2026.zelfstandigenaftrek;
  const startersaftrek =
    isStarter && starterYearsUsed < TAX_RATES_2026.starterMaxYears
      ? TAX_RATES_2026.startersaftrek
      : 0;

  const profitAfterDeductions = Math.max(
    0,
    grossProfit - zelfstandigenaftrek - startersaftrek
  );
  const mkbVrijstelling = calculateMKBVrijstelling(profitAfterDeductions);

  const totalBenefit = zelfstandigenaftrek + startersaftrek + mkbVrijstelling;

  // Bereken belastingvoordeel (gemiddeld tarief ~40%)
  const taxSavings = Math.round(totalBenefit * 0.4);

  return {
    zelfstandigenaftrek,
    startersaftrek,
    mkbVrijstelling,
    totalBenefit,
    taxSavings,
  };
}

/**
 * Rond af op 2 decimalen
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
