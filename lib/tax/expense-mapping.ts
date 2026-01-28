/**
 * Mapping van ExpenseCategory naar belastingcategorieën
 * Voor het jaarlijkse belastingrapport
 */

import { ExpenseCategory } from '@prisma/client';

// Belastingcategorieën voor het jaarrapport
export type TaxExpenseCategory =
  | 'TRANSPORT'       // Vervoerskosten
  | 'HOUSING'         // Huisvestingskosten
  | 'GENERAL'         // Algemene kosten
  | 'OFFICE'          // Kantoorkosten
  | 'OUTSOURCED'      // Uitbesteed werk
  | 'REPRESENTATION'  // Representatiekosten
  | 'OTHER';          // Overige kosten

// Mapping van systeem ExpenseCategory naar belasting TaxExpenseCategory
export const EXPENSE_TO_TAX_CATEGORY: Record<ExpenseCategory, TaxExpenseCategory> = {
  TRAVEL: 'TRANSPORT',
  RENT: 'HOUSING',
  UTILITIES: 'HOUSING',
  TELECOM: 'GENERAL',
  INSURANCE: 'GENERAL',
  SOFTWARE: 'OFFICE',
  EQUIPMENT: 'OFFICE',
  OFFICE: 'OFFICE',
  PROFESSIONAL: 'OUTSOURCED',
  ACCOUNTANT: 'OUTSOURCED',
  MARKETING: 'REPRESENTATION', // Let op: 80% aftrekbaar
  EDUCATION: 'GENERAL',
  MAINTENANCE: 'OTHER',
  OTHER: 'OTHER',
};

// Nederlandse labels voor belastingcategorieën
export const TAX_CATEGORY_LABELS: Record<TaxExpenseCategory, string> = {
  TRANSPORT: 'Vervoerskosten',
  HOUSING: 'Huisvestingskosten',
  GENERAL: 'Algemene kosten',
  OFFICE: 'Kantoorkosten',
  OUTSOURCED: 'Uitbesteed werk',
  REPRESENTATION: 'Representatiekosten',
  OTHER: 'Overige kosten',
};

// Categorieën met speciale aftrekregels
export const SPECIAL_DEDUCTION_CATEGORIES: Partial<Record<ExpenseCategory, {
  deductiblePercentage: number;
  description: string;
}>> = {
  MARKETING: {
    deductiblePercentage: 80,
    description: 'Representatiekosten zijn voor 80% aftrekbaar',
  },
};

/**
 * Bepaal de belastingcategorie voor een expense
 */
export function getTaxCategory(category: ExpenseCategory): TaxExpenseCategory {
  return EXPENSE_TO_TAX_CATEGORY[category] || 'OTHER';
}

/**
 * Bepaal het aftrekbare bedrag voor een expense
 * Houdt rekening met speciale regels (bijv. representatiekosten)
 */
export function getDeductibleAmount(
  category: ExpenseCategory,
  amount: number,
  customDeductiblePercentage?: number
): number {
  // Als er een custom percentage is ingesteld, gebruik dat
  if (customDeductiblePercentage !== undefined) {
    return amount * (customDeductiblePercentage / 100);
  }

  // Check op speciale regels
  const specialRule = SPECIAL_DEDUCTION_CATEGORIES[category];
  if (specialRule) {
    return amount * (specialRule.deductiblePercentage / 100);
  }

  // Standaard: volledig aftrekbaar
  return amount;
}

/**
 * Groepeer expenses per belastingcategorie
 */
export function groupExpensesByTaxCategory<T extends { category: ExpenseCategory; netAmount: number | { toNumber(): number } }>(
  expenses: T[]
): Record<TaxExpenseCategory, number> {
  const result: Record<TaxExpenseCategory, number> = {
    TRANSPORT: 0,
    HOUSING: 0,
    GENERAL: 0,
    OFFICE: 0,
    OUTSOURCED: 0,
    REPRESENTATION: 0,
    OTHER: 0,
  };

  for (const expense of expenses) {
    const taxCategory = getTaxCategory(expense.category);
    const amount = typeof expense.netAmount === 'number'
      ? expense.netAmount
      : expense.netAmount.toNumber();
    result[taxCategory] += amount;
  }

  // Rond af op 2 decimalen
  for (const key of Object.keys(result) as TaxExpenseCategory[]) {
    result[key] = Math.round(result[key] * 100) / 100;
  }

  return result;
}
