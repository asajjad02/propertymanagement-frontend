'use client';

import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface FilterChip {
  /** Stable id for the key. */
  id: string;
  /** Human label shown in the chip, e.g. "Building: Block A". */
  label: string;
  onRemove: () => void;
}

/**
 * The active-filter summary above a list table (docs/design/patterns/filtering.md):
 * one dismissible chip per active filter, plus Clear all. Renders nothing when no
 * filters are active. Keeps constraints visible and reversible.
 */
export function FilterChips({
  chips,
  onClearAll,
  className,
}: {
  chips: FilterChip[];
  onClearAll: () => void;
  className?: string;
}) {
  if (chips.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="label-mono">Filters</span>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-surface py-1 pl-2.5 pr-1 text-xs text-ink-secondary"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-pill p-0.5 text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-primary-text hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
