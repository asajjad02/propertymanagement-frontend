'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';

import { cn } from '@/lib/cn';

export interface SegmentedOption {
  value: string;
  label: string;
  /**
   * Records matching this segment. Rendering the count here is what lets a list
   * screen drop its stat-card row on mobile: "All 19 / Occupied 15 / Vacant 4"
   * carries the same numbers as three tiles, in one row, and each one is a
   * filter rather than a read-only tile.
   */
  count?: number;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Set when used as a form control, so a `Field` label can point at it. */
  id?: string;
  className?: string;
}

/**
 * Single-select segmented control (All / Occupied / Vacant …).
 *
 * Also the right control for a two- or three-value *form* field: both answers
 * stay visible and switching costs one tap, where a `Select` hides the options
 * behind a tap and a popover.
 */
export function Segmented({ options, value, onValueChange, id, className }: SegmentedProps) {
  return (
    <ToggleGroup.Root
      id={id}
      type="single"
      value={value}
      // Radix emits '' when the active item is re-clicked; ignore to keep one selected.
      onValueChange={(v) => v && onValueChange(v)}
      // Mobile: fills the row so each segment is a wide, thumb-sized target,
      // scrolling horizontally if the labels genuinely don't fit. Desktop keeps
      // the compact inline control.
      className={cn(
        'flex w-full overflow-x-auto scrollbar-none rounded-control border border-hairline bg-raised p-0.5',
        'md:inline-flex md:w-auto md:overflow-visible',
        className,
      )}
    >
      {options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          className={cn(
            // Segments are wide (about a third of the screen each), so they
            // don't need 44px of height to be easy to hit — and at that height
            // the control block outweighed the record rows beneath it.
            'group min-w-fit flex-1 whitespace-nowrap rounded-md px-3 py-1 text-[0.8125rem] leading-5 text-muted transition-colors',
            'touch-manipulation',
            'hover:text-ink data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:font-medium data-[state=on]:shadow-hair',
            'focus-visible:outline-none',
            'md:flex-none md:py-1',
          )}
        >
          <span className="inline-flex items-baseline gap-1.5">
            {opt.label}
            {/* Mobile only: on desktop these numbers are already on the stat
                tiles, and showing them twice is noise. */}
            {opt.count != null && (
              <span className="text-xs tabular-nums text-muted group-data-[state=on]:text-ink-secondary md:hidden">
                {opt.count}
              </span>
            )}
          </span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
