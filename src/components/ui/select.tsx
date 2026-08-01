'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/** Styled Radix Select. Values are strings; convert ids at the call site. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  id,
  disabled,
  className,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        id={id}
        className={cn(
          'inline-flex h-11 items-center justify-between gap-2 rounded-control border border-hairline',
          'bg-surface px-3 text-base text-ink data-[placeholder]:text-faint touch-manipulation',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25',
          'disabled:opacity-50 min-w-[9rem]',
          'md:h-9.5 md:text-sm',
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 text-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          // collisionPadding keeps the popper off the safe-area edges on phones;
          // the height cap makes long option lists scroll instead of overflowing
          // a short mobile viewport.
          collisionPadding={12}
          className={cn(
            'z-50 max-h-[min(24rem,60dvh)] overflow-hidden rounded-control border border-hairline',
            'bg-surface shadow-pop',
          )}
        >
          <RadixSelect.Viewport className="max-h-[min(24rem,60dvh)] overflow-y-auto p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-[7px] py-2.5 pl-8 pr-3',
                  'text-base text-ink outline-none data-[highlighted]:bg-raised data-[state=checked]:font-medium',
                  'md:py-1.5 md:text-sm',
                )}
              >
                <RadixSelect.ItemIndicator className="absolute left-2">
                  <Check className="h-4 w-4 text-primary" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
