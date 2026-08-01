'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/cn';

import { Button } from './button';
import { Sheet } from './sheet';

export interface FilterSheetProps {
  /** The filter controls. Rendered inline at `md`+, inside the sheet below it. */
  children: React.ReactNode;
  /** Number of filters currently applied — shown as a badge on the trigger. */
  activeCount?: number;
  onClearAll?: () => void;
  className?: string;
}

/**
 * Filters as a sheet on mobile, inline on desktop.
 *
 * Filters are set-then-read, not scanned continuously, so on a phone they earn
 * a button and a count badge rather than permanent vertical space above every
 * list. `children` is mounted exactly once at any moment: the sheet copy only
 * exists while open, and the inline copy steps aside while it does — so
 * duplicate element ids and doubled-up controlled inputs never occur. (The
 * trigger is `md:hidden`, so the sheet can only ever open below `md`, where
 * the inline copy is `display: none` regardless.)
 *
 * Filtering is applied live as each control changes (the same behaviour as
 * desktop), so the sheet's footer is Done/Clear, not Apply/Cancel — nothing is
 * staged and there is nothing to discard.
 */
export function FilterSheet({ children, activeCount = 0, onClearAll, className }: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Icon-only: the word "Filters" cost ~70px next to the search field and
          clipped its placeholder. The sheet it opens is titled "Filters", and
          the badge reports how many are on. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={activeCount > 0 ? `Filters (${activeCount} active)` : 'Filters'}
        className={cn(
          // 40px to match the toolbar's search field (see search-input.tsx).
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-hairline',
          'bg-surface text-ink-secondary touch-manipulation transition-colors active:bg-raised',
          activeCount > 0 && 'border-primary/40 text-primary-text',
          'md:hidden',
          className,
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span
            aria-hidden
            className={cn(
              'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-pill',
              'bg-primary px-1 text-[0.625rem] font-medium leading-none text-white tabular-nums',
            )}
          >
            {activeCount}
          </span>
        )}
      </button>

      {!open && (
        <div className={cn('hidden md:flex md:flex-wrap md:items-center md:gap-2', className)}>
          {children}
        </div>
      )}

      {open && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Filters"
          footer={
            <>
              {onClearAll && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClearAll();
                    setOpen(false);
                  }}
                  disabled={activeCount === 0}
                >
                  Clear all
                </Button>
              )}
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          }
        >
          {/* Each control spans the sheet — a filter is a decision, and a
              full-width row is the easiest thing to hit and read. */}
          <div className="space-y-4 py-2 *:w-full">{children}</div>
        </Sheet>
      )}
    </>
  );
}
