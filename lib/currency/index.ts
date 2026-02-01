/**
 * Multi-Currency Module
 *
 * Export all currency-related services and utilities.
 */

// ECB Sync Service
export {
  fetchECBRates,
  syncECBRates,
  getLatestRateDate,
  shouldSyncRates,
} from './ecb-sync';

// Exchange Rate Service
export {
  getExchangeRate,
  getLatestRates,
  getHistoricalRates,
  hasRateForDate,
  type ExchangeRateResult,
  type GetRateOptions,
} from './rates';

// Conversion Utilities
export {
  getCurrencyDecimals,
  getCurrencyDecimalsFromDb,
  roundToDecimals,
  roundForCurrency,
  convertAmount,
  convertAndRound,
  convertToEur,
  calculateEurEquivalents,
  formatRateForStorage,
  formatAmountForStorage,
  isEffectivelyZero,
  getSmallestUnit,
  type InvoiceAmounts,
  type EurEquivalents,
} from './conversion';

// Formatting Utilities
export {
  formatCurrencyAmount,
  formatExchangeRate,
  formatExchangeRateString,
  formatWithEurEquivalent,
  getCurrencySymbol,
  formatCurrencyWithSymbol,
  getCurrencyDisplayInfo,
  formatAmountForPdf,
  formatRateDate,
  formatRateSource,
  type FormatCurrencyOptions,
  type CurrencyDisplayInfo,
} from './formatting';

// Invoice Currency Service
export {
  getInvoiceCurrency,
  lockInvoiceExchangeRate,
  calculateInvoiceEurEquivalents,
  getInvoiceCurrencyInfo,
  updateInvoiceCurrencyAmounts,
} from './invoice-currency';
