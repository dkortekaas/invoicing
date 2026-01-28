/**
 * Nederlandse belastingtarieven voor 2026
 * Bron: Belastingdienst
 */

export const TAX_RATES_2026 = {
  // Ondernemersaftrekken
  zelfstandigenaftrek: 2470, // Was 3750 in 2023, wordt afgebouwd
  startersaftrek: 2123,

  // MKB-winstvrijstelling
  mkbVrijstellingPercentage: 13.31, // 13.31% van de winst na aftrekken

  // Kleinschaligheidsinvesteringsaftrek (KIA)
  kia: {
    minInvestment: 2800,      // Minimale investering
    maxInvestment: 387580,    // Maximale investering voor KIA
    // KIA schijven 2026 (geschat, check actuele waarden)
    brackets: [
      { min: 2800, max: 65915, percentage: 28 },
      { min: 65915, max: 119749, fixed: 18456 },
      { min: 119749, max: 387580, percentage: 7.56, subtract: true },
      // Boven 387.580 geen KIA
    ],
  },

  // Fiscale Oudedagsreserve (FOR)
  for: {
    maxPercentage: 9.44,  // Maximaal 9.44% van de winst
    maxAmount: 10083,     // Maximaal bedrag per jaar
  },

  // Urencriterium
  hoursCriterionMin: 1225, // Minimaal 1225 uur per jaar

  // Representatiekosten
  representation: {
    maxDeductible: 4800,  // Maximaal aftrekbaar per jaar (optioneel)
    percentage: 80,       // 80% aftrekbaar (20% niet aftrekbaar)
  },

  // Box 1 tarieven 2026 (geschat)
  box1: {
    bracket1Max: 75518,    // Tot dit bedrag: laag tarief
    bracket1Rate: 36.97,   // Tarief schijf 1
    bracket2Rate: 49.50,   // Tarief schijf 2
  },

  // Startersaftrek maximum jaren
  starterMaxYears: 3,

  // Arbeidskorting (voor berekening netto)
  arbeidskorting: {
    maxAmount: 5532,     // Maximaal bedrag
    // Formule is complex en hangt af van inkomen
  },

  // Algemene heffingskorting (voor berekening netto)
  algemeneHeffingskorting: {
    maxAmount: 3362,     // Maximaal bedrag
  },
} as const;

export type TaxRates = typeof TAX_RATES_2026;

/**
 * Bereken KIA bedrag op basis van totale investeringen
 */
export function calculateKIA(totalInvestments: number): number {
  const { kia } = TAX_RATES_2026;

  // Geen KIA onder minimum of boven maximum
  if (totalInvestments < kia.minInvestment) {
    return 0;
  }

  if (totalInvestments > kia.maxInvestment) {
    return 0;
  }

  // Schijf 1: 28% van investering
  if (totalInvestments <= kia.brackets[0].max) {
    return Math.round(totalInvestments * (kia.brackets[0].percentage / 100));
  }

  // Schijf 2: vast bedrag
  if (totalInvestments <= kia.brackets[1].max) {
    return kia.brackets[1].fixed!;
  }

  // Schijf 3: afbouw
  const bracket3 = kia.brackets[2];
  const reduction = (totalInvestments - kia.brackets[1].max) * (bracket3.percentage! / 100);
  return Math.max(0, Math.round(kia.brackets[1].fixed! - reduction));
}

/**
 * Bereken zelfstandigenaftrek
 * Alleen van toepassing als aan urencriterium wordt voldaan
 */
export function calculateZelfstandigenaftrek(meetsHoursCriterion: boolean): number {
  if (!meetsHoursCriterion) {
    return 0;
  }
  return TAX_RATES_2026.zelfstandigenaftrek;
}

/**
 * Bereken startersaftrek
 * Alleen van toepassing als starter en aan urencriterium wordt voldaan
 */
export function calculateStartersaftrek(
  meetsHoursCriterion: boolean,
  isStarter: boolean,
  starterYearsUsed: number
): number {
  if (!meetsHoursCriterion || !isStarter) {
    return 0;
  }

  if (starterYearsUsed >= TAX_RATES_2026.starterMaxYears) {
    return 0;
  }

  return TAX_RATES_2026.startersaftrek;
}

/**
 * Bereken FOR dotatie
 */
export function calculateFORDotation(profit: number, useFOR: boolean): number {
  if (!useFOR || profit <= 0) {
    return 0;
  }

  const { for: forRates } = TAX_RATES_2026;
  const percentage = profit * (forRates.maxPercentage / 100);
  return Math.min(Math.round(percentage), forRates.maxAmount);
}

/**
 * Bereken MKB-winstvrijstelling
 */
export function calculateMKBVrijstelling(profitAfterDeductions: number): number {
  if (profitAfterDeductions <= 0) {
    return 0;
  }

  return Math.round(profitAfterDeductions * (TAX_RATES_2026.mkbVrijstellingPercentage / 100));
}

/**
 * Bereken geschatte inkomstenbelasting box 1
 */
export function calculateEstimatedTax(taxableIncome: number): number {
  if (taxableIncome <= 0) {
    return 0;
  }

  const { box1 } = TAX_RATES_2026;

  if (taxableIncome <= box1.bracket1Max) {
    return Math.round(taxableIncome * (box1.bracket1Rate / 100));
  }

  const taxBracket1 = box1.bracket1Max * (box1.bracket1Rate / 100);
  const taxBracket2 = (taxableIncome - box1.bracket1Max) * (box1.bracket2Rate / 100);

  return Math.round(taxBracket1 + taxBracket2);
}

/**
 * Controleer of aan urencriterium wordt voldaan
 */
export function meetsHoursCriterion(hoursWorked: number): boolean {
  return hoursWorked >= TAX_RATES_2026.hoursCriterionMin;
}
