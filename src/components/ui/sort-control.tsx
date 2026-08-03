'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn';

import { Sheet } from './sheet';

export interface SortOption {
  /** The DRF `ordering` field name. */
  field: string;
  label: string;
}

/** Split a DRF ordering string into field + direction. */
export function parseOrdering(ordering: string | null | undefined) {
  if (!ordering) return { field: null as string | null, desc: false };
  return ordering.startsWith('-')
    ? { field: ordering.slice(1), desc: true }
    : { field: ordering, desc: false };
}

/**
 * Sort trigger + sheet for mobile, where the card list has no column headers to
 * click. Lives in the `ListToolbar` beside the filter button so sorting doesn't
 * cost its own row; `DataTable` renders its own fallback for lists that haven't
 * adopted the toolbar yet.
 */
export function SortControl({
  options,
  ordering,
  onOrderingChange,
  defaultOrdering,
  className,
}: {
  options: SortOption[];
  ordering?: string | null;
  onOrderingChange: (ordering: string | null) => void;
  /**
   * The list's resting order. The trigger only highlights when the user has
   * chosen something else — otherwise every list would open with the sort
   * button already lit, which says "a sort is applied" when none was asked for.
   */
  defaultOrdering?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = parseOrdering(ordering);

  if (options.length === 0) return null;

  function choose(field: string) {
    // Re-picking the active field flips direction; a new field starts ascending.
    if (active.field === field) onOrderingChange(active.desc ? field : `-${field}`);
    else onOrderingChange(field);
    setOpen(false);
  }

  const isSorted = !!active.field;
  const isCustom = isSorted && ordering !== defaultOrdering;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sort"
        className={cn(
          // 40px to match the toolbar's search field (see search-input.tsx).
          'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-control border border-hairline',
          'bg-surface text-ink-secondary transition-colors touch-manipulation active:bg-raised',
          isCustom && 'border-primary/40 text-primary-text',
          className,
        )}
      >
        {isCustom ? (
          active.desc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4" />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Sort by">
        <ul className="pb-2">
          {options.map((o) => {
            const isActive = active.field === o.field;
            return (
              <li key={o.field}>
                <button
                  type="button"
                  onClick={() => choose(o.field)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-3 rounded-control px-2 py-3.5 text-left',
                    'text-base touch-manipulation transition-colors active:bg-raised',
                    isActive ? 'font-medium text-ink' : 'text-ink-secondary',
                  )}
                >
                  {o.label}
                  {isActive &&
                    (active.desc ? (
                      <ArrowDown className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <ArrowUp className="h-4 w-4 shrink-0 text-primary" />
                    ))}
                </button>
              </li>
            );
          })}
          {isSorted && (
            <li className="border-t border-hairline pt-1">
              <button
                type="button"
                onClick={() => {
                  onOrderingChange(null);
                  setOpen(false);
                }}
                className="w-full cursor-pointer rounded-control px-2 py-3.5 text-left text-base text-muted transition-colors active:bg-raised"
              >
                Clear sort
              </button>
            </li>
          )}
        </ul>
      </Sheet>
    </>
  );
}
