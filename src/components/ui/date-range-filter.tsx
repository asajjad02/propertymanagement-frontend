'use client';

import { cn } from '@/lib/cn';

/**
 * A from/to date range for filtering temporal fields (billing period, visitor
 * entry date). Maps to two DRF query params at the call site — typically
 * `field__gte` / `field__lte` (see docs/design/patterns/filtering.md). Native
 * date inputs inherit the theme's color-scheme so the picker adapts in dark mode.
 */
export interface DateRange {
  from?: string;
  to?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex h-9.5 items-center gap-2 rounded-control border border-hairline bg-surface px-2.5 text-sm text-ink transition-colors hover:border-muted/40',
        className,
      )}
    >
      <input
        type="date"
        aria-label="From date"
        value={value.from ?? ''}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        className="bg-transparent text-ink placeholder:text-faint focus:outline-none"
      />
      <span className="text-xs text-faint">→</span>
      <input
        type="date"
        aria-label="To date"
        value={value.to ?? ''}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        className="bg-transparent text-ink placeholder:text-faint focus:outline-none"
      />
    </div>
  );
}
