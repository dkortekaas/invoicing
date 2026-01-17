import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: nl });
}

export function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy', { locale: nl });
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd MMM yyyy HH:mm', { locale: nl });
}

export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: nl });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
