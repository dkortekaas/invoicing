/**
 * Afschrijvingsberekeningen voor bedrijfsmiddelen
 */

import { DepreciationMethod } from '@prisma/client';

export interface DepreciationCalculation {
  year: number;
  amount: number;
  bookValueStart: number;
  bookValueEnd: number;
}

export interface AssetDepreciationInput {
  purchasePrice: number;
  residualValue: number;
  usefulLifeYears: number;
  purchaseDate: Date;
  depreciationMethod: DepreciationMethod;
}

/**
 * Bereken lineaire afschrijving per jaar
 * Gelijke bedragen elk jaar
 */
export function calculateLinearDepreciation(
  purchasePrice: number,
  residualValue: number,
  usefulLifeYears: number
): number {
  if (usefulLifeYears <= 0) {
    return 0;
  }

  const depreciableAmount = purchasePrice - residualValue;
  return Math.round((depreciableAmount / usefulLifeYears) * 100) / 100;
}

/**
 * Bereken degressieve afschrijving per jaar
 * Percentage van de boekwaarde (bijv. 25%)
 */
export function calculateDegressiveDepreciation(
  bookValue: number,
  usefulLifeYears: number,
  residualValue: number
): number {
  // Typisch percentage: 2x lineair percentage
  const degressivePercentage = (2 / usefulLifeYears) * 100;
  const percentage = Math.min(degressivePercentage, 40); // Max 40%

  const depreciation = bookValue * (percentage / 100);

  // Niet onder restwaarde komen
  const maxDepreciation = bookValue - residualValue;
  return Math.round(Math.min(depreciation, maxDepreciation) * 100) / 100;
}

/**
 * Genereer volledig afschrijvingsschema voor een activum
 */
export function generateDepreciationSchedule(
  input: AssetDepreciationInput
): DepreciationCalculation[] {
  const { purchasePrice, residualValue, usefulLifeYears, purchaseDate, depreciationMethod } = input;

  const schedule: DepreciationCalculation[] = [];
  let bookValue = purchasePrice;
  const startYear = purchaseDate.getFullYear();

  // Bereken proportioneel deel eerste jaar
  const monthOfPurchase = purchaseDate.getMonth() + 1; // 1-12
  const monthsRemaining = 12 - monthOfPurchase + 1;
  const firstYearFraction = monthsRemaining / 12;

  for (let i = 0; i < usefulLifeYears; i++) {
    const year = startYear + i;
    const bookValueStart = bookValue;

    let yearlyDepreciation: number;

    if (depreciationMethod === 'LINEAR') {
      yearlyDepreciation = calculateLinearDepreciation(
        purchasePrice,
        residualValue,
        usefulLifeYears
      );
    } else {
      yearlyDepreciation = calculateDegressiveDepreciation(
        bookValue,
        usefulLifeYears - i,
        residualValue
      );
    }

    // Eerste jaar: proportioneel
    if (i === 0) {
      yearlyDepreciation = Math.round(yearlyDepreciation * firstYearFraction * 100) / 100;
    }

    // Niet onder restwaarde
    yearlyDepreciation = Math.min(yearlyDepreciation, bookValue - residualValue);
    yearlyDepreciation = Math.max(yearlyDepreciation, 0);

    bookValue = Math.round((bookValue - yearlyDepreciation) * 100) / 100;

    schedule.push({
      year,
      amount: yearlyDepreciation,
      bookValueStart,
      bookValueEnd: bookValue,
    });

    // Stop als restwaarde bereikt
    if (bookValue <= residualValue) {
      break;
    }
  }

  // Als er nog restwaarde over is na de termijn, voeg extra jaar toe
  if (bookValue > residualValue) {
    const lastEntry = schedule[schedule.length - 1];
    if (lastEntry) {
      const remainingDepreciation = bookValue - residualValue;
      schedule.push({
        year: lastEntry.year + 1,
        amount: remainingDepreciation,
        bookValueStart: bookValue,
        bookValueEnd: residualValue,
      });
    }
  }

  return schedule;
}

/**
 * Bereken afschrijving voor een specifiek jaar
 */
export function getDepreciationForYear(
  input: AssetDepreciationInput,
  targetYear: number
): DepreciationCalculation | null {
  const schedule = generateDepreciationSchedule(input);
  return schedule.find(entry => entry.year === targetYear) || null;
}

/**
 * Bereken huidige boekwaarde op een bepaalde datum
 */
export function calculateCurrentBookValue(
  input: AssetDepreciationInput,
  asOfDate: Date = new Date()
): number {
  const targetYear = asOfDate.getFullYear();
  const schedule = generateDepreciationSchedule(input);

  // Vind de laatste entry voor of in het doeljaar
  let bookValue = input.purchasePrice;

  for (const entry of schedule) {
    if (entry.year <= targetYear) {
      bookValue = entry.bookValueEnd;
    } else {
      break;
    }
  }

  return bookValue;
}

/**
 * Bereken totale afschrijving voor een jaar over alle activa
 */
export function calculateTotalDepreciationForYear(
  assets: Array<{
    purchasePrice: number;
    residualValue: number;
    usefulLifeYears: number;
    purchaseDate: Date;
    depreciationMethod: DepreciationMethod;
    isActive: boolean;
    disposalDate?: Date | null;
  }>,
  year: number
): number {
  let total = 0;

  for (const asset of assets) {
    // Skip als activum niet actief of al verkocht voor dit jaar
    if (!asset.isActive) {
      continue;
    }

    if (asset.disposalDate && asset.disposalDate.getFullYear() < year) {
      continue;
    }

    const depreciation = getDepreciationForYear(
      {
        purchasePrice: asset.purchasePrice,
        residualValue: asset.residualValue,
        usefulLifeYears: asset.usefulLifeYears,
        purchaseDate: asset.purchaseDate,
        depreciationMethod: asset.depreciationMethod,
      },
      year
    );

    if (depreciation) {
      total += depreciation.amount;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Bereken totale investeringen voor KIA in een jaar
 * Alleen activa aangeschaft in dat jaar tellen mee
 */
export function calculateKIAInvestments(
  assets: Array<{
    purchasePrice: number;
    purchaseDate: Date;
    kiaApplied: boolean;
  }>,
  year: number
): number {
  let total = 0;

  for (const asset of assets) {
    // Alleen activa aangeschaft in het doeljaar
    if (asset.purchaseDate.getFullYear() !== year) {
      continue;
    }

    // Skip als KIA al toegepast
    if (asset.kiaApplied) {
      continue;
    }

    total += asset.purchasePrice;
  }

  return Math.round(total * 100) / 100;
}
