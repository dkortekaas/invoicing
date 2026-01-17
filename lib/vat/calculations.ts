import { endOfQuarter } from 'date-fns';

/**
 * Bereken BTW bedrag uit totaal bedrag inclusief BTW
 */
export function calculateVATFromGross(
  grossAmount: number,
  vatRate: number
): number {
  return (grossAmount / (1 + vatRate / 100)) * (vatRate / 100);
}

/**
 * Bereken netto bedrag (exclusief BTW) uit totaal bedrag
 */
export function calculateNetFromGross(
  grossAmount: number,
  vatRate: number
): number {
  return grossAmount / (1 + vatRate / 100);
}

/**
 * Bereken BTW bedrag uit netto bedrag
 */
export function calculateVATFromNet(
  netAmount: number,
  vatRate: number
): number {
  return netAmount * (vatRate / 100);
}

/**
 * Detecteer BTW tarief op basis van percentage
 */
export function detectVATRate(percentage: number): 'high' | 'low' | 'zero' {
  if (percentage >= 20) return 'high'; // 21%
  if (percentage >= 8 && percentage <= 10) return 'low'; // 9%
  return 'zero'; // 0%
}

/**
 * Haal kwartaal informatie op
 */
export function getQuarterInfo(year: number, quarter: number) {
  if (quarter < 1 || quarter > 4) {
    throw new Error('Quarter must be 1-4');
  }

  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = endOfQuarter(startDate);

  return {
    year,
    quarter,
    startDate,
    endDate,
    label: `Q${quarter} ${year}`,
  };
}

/**
 * Bereken huidig kwartaal
 */
export function getCurrentQuarter() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return {
    year: now.getFullYear(),
    quarter,
  };
}

/**
 * Krijg vorig kwartaal
 */
export function getPreviousQuarter(year: number, quarter: number) {
  if (quarter === 1) {
    return { year: year - 1, quarter: 4 };
  }
  return { year, quarter: quarter - 1 };
}

/**
 * Check of BTW nummer geldig is (basis check)
 */
export function isValidVATNumber(vatNumber: string, country: string = 'NL'): boolean {
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // Nederlandse BTW-nummer: NL + 9 cijfers + B + 2 cijfers
  if (country === 'NL') {
    return /^NL\d{9}B\d{2}$/.test(cleaned);
  }
  
  // Basis EU check - start met landcode
  return /^[A-Z]{2}/.test(cleaned);
}

/**
 * Detecteer of klant EU klant is (voor ICP)
 */
export function isEUCustomer(country: string): boolean {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ];
  
  return euCountries.includes(country.toUpperCase());
}

/**
 * Format BTW nummer
 */
export function formatVATNumber(vatNumber: string): string {
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // NL123456789B01 → NL 1234.5678.9.B.01
  if (cleaned.startsWith('NL')) {
    const number = cleaned.substring(2);
    if (number.length === 11) {
      return `NL ${number.substring(0, 4)}.${number.substring(4, 8)}.${number.substring(8, 9)}.B.${number.substring(10)}`;
    }
  }
  
  return cleaned;
}

/**
 * Bereken aftrekbare BTW op basis van percentage
 */
export function calculateDeductibleVAT(
  vatAmount: number,
  deductiblePercentage: number
): number {
  return vatAmount * (deductiblePercentage / 100);
}
