/** Presentation helpers shared across the app. Keep formatting logic here. */
import { format, parseISO } from 'date-fns';

/** Format a DRF decimal string as PKR currency (e.g. "1,250.00" → "Rs 1,250"). */
export function money(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return `Rs ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

/** Format a decimal string as a plain number (readings, units). */
export function numeric(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(num) ? '—' : num.toLocaleString('en-PK');
}

/** Format an ISO date string as "12 Jan 2026". */
export function shortDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'd MMM yyyy');
  } catch {
    return '—';
  }
}

/** Format an ISO datetime as "12 Jan, 3:45 PM". */
export function dateTime(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'd MMM, h:mm a');
  } catch {
    return '—';
  }
}

/** Time only, e.g. "3:45 PM". */
export function timeOnly(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'h:mm a');
  } catch {
    return '—';
  }
}

/** Initials from a full name, max two letters (e.g. "Ali Raza" → "AR"). */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
