/**
 * Tax module exports
 * Inkomstenbelasting berekeningen voor ZZP'ers
 */

// Rates & constants
export {
  TAX_RATES_2026,
  calculateKIA,
  calculateZelfstandigenaftrek,
  calculateStartersaftrek,
  calculateFORDotation,
  calculateMKBVrijstelling,
  calculateEstimatedTax,
  meetsHoursCriterion,
} from './rates';

// Expense mapping
export {
  EXPENSE_TO_TAX_CATEGORY,
  TAX_CATEGORY_LABELS,
  SPECIAL_DEDUCTION_CATEGORIES,
  getTaxCategory,
  getDeductibleAmount,
  groupExpensesByTaxCategory,
  type TaxExpenseCategory,
} from './expense-mapping';

// Depreciation
export {
  calculateLinearDepreciation,
  calculateDegressiveDepreciation,
  generateDepreciationSchedule,
  getDepreciationForYear,
  calculateCurrentBookValue,
  calculateTotalDepreciationForYear,
  calculateKIAInvestments,
  type DepreciationCalculation,
  type AssetDepreciationInput,
} from './depreciation';

// Core calculations
export {
  calculateTaxReport,
  calculateEffectiveTaxRate,
  calculateTaxSavings,
  hoursNeededForCriterion,
  calculateHoursCriterionBenefit,
  type TaxReportInput,
  type TaxReportResult,
} from './calculations';

// Report generator
export {
  generateTaxReport,
  saveTaxReport,
  getAvailableYears,
  getExistingReports,
  getTaxReport,
  updateTaxReportStatus,
  type GenerateTaxReportOptions,
} from './report-generator';
