'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';

import { cn } from '@/lib/cn';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/** Single-select segmented control (All / Occupied / Vacant …). */
export function Segmented({ options, value, onValueChange, className }: SegmentedProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Radix emits '' when the active item is re-clicked; ignore to keep one selected.
      onValueChange={(v) => v && onValueChange(v)}
      className={cn('inline-flex rounded-control border border-hairline bg-surface p-0.5', className)}
    >
      {options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          className={cn(
            'rounded-[7px] px-3 py-1 text-[0.8125rem] text-muted transition-colors',
            'hover:text-ink data-[state=on]:bg-paper data-[state=on]:text-ink data-[state=on]:font-medium',
            'focus-visible:outline-none',
          )}
        >
          {opt.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
