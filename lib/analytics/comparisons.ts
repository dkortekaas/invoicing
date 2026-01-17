import { 
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';

export type ComparisonPeriod = 'month' | 'quarter' | 'year';

export interface PeriodComparison {
  current: {
    label: string;
    value: number;
  };
  previous: {
    label: string;
    value: number;
  };
  change: number; // Absolute change
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

export function getPeriodDates(
  period: ComparisonPeriod,
  offset: number = 0
) {
  const now = new Date();

  switch (period) {
    case 'month': {
      const target = subMonths(now, offset);
      return {
        start: startOfMonth(target),
        end: endOfMonth(target),
      };
    }
    case 'quarter': {
      const target = subMonths(now, offset * 3);
      return {
        start: startOfQuarter(target),
        end: endOfQuarter(target),
      };
    }
    case 'year': {
      const target = subYears(now, offset);
      return {
        start: startOfYear(target),
        end: endOfYear(target),
      };
    }
  }
}

export function calculateComparison(
  currentValue: number,
  previousValue: number,
  currentLabel: string,
  previousLabel: string
): PeriodComparison {
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0
    ? (change / previousValue) * 100
    : 0;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (Math.abs(changePercentage) > 1) {
    trend = change > 0 ? 'up' : 'down';
  }

  return {
    current: {
      label: currentLabel,
      value: currentValue,
    },
    previous: {
      label: previousLabel,
      value: previousValue,
    },
    change,
    changePercentage,
    trend,
  };
}
