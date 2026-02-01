/**
 * Currency Decimal Places (client-safe)
 *
 * Static map and helper for currency decimal places. No database dependency
 * so this module can be used in client components (e.g. invoice-form).
 */

/** Default decimal places for currencies without specific settings */
const DEFAULT_DECIMAL_PLACES = 2;

/** Currency-specific decimal places */
const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0, // Japanese Yen has no decimals
  KRW: 0, // Korean Won has no decimals
  BIF: 0, // Burundian Franc
  CLP: 0, // Chilean Peso
  DJF: 0, // Djiboutian Franc
  GNF: 0, // Guinean Franc
  ISK: 0, // Icelandic Króna
  KMF: 0, // Comorian Franc
  PYG: 0, // Paraguayan Guaraní
  RWF: 0, // Rwandan Franc
  UGX: 0, // Ugandan Shilling
  VND: 0, // Vietnamese Dong
  VUV: 0, // Vanuatu Vatu
  XAF: 0, // Central African CFA Franc
  XOF: 0, // West African CFA Franc
  XPF: 0, // CFP Franc
  BHD: 3, // Bahraini Dinar
  IQD: 3, // Iraqi Dinar
  JOD: 3, // Jordanian Dinar
  KWD: 3, // Kuwaiti Dinar
  LYD: 3, // Libyan Dinar
  OMR: 3, // Omani Rial
  TND: 3, // Tunisian Dinar
};

/**
 * Get the number of decimal places for a currency code.
 * Safe to use in client components (no DB).
 */
export function getCurrencyDecimals(code: string): number {
  if (CURRENCY_DECIMALS[code] !== undefined) {
    return CURRENCY_DECIMALS[code];
  }
  return DEFAULT_DECIMAL_PLACES;
}
