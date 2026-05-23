import dayjs from 'dayjs';

// Format number as Malaysian Ringgit
export function formatRM(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date as DD/MM/YYYY
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD/MM/YYYY');
}

// Format month label e.g. "May 2026"
export function formatMonth(date: string | Date): string {
  return dayjs(date).format('MMM YYYY');
}

// Format percentage
export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

// Mask balance for privacy
export function maskBalance(): string {
  return 'RM •••••';
}

// Color for budget status
export function budgetStatusColor(status: 'on_track' | 'approaching' | 'exceeded'): string {
  return {
    on_track:   '#22c55e',
    approaching:'#eab308',
    exceeded:   '#ef4444',
  }[status] ?? '#6b7280';
}
