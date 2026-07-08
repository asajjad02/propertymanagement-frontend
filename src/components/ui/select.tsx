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
          'inline-flex h-9.5 items-center justify-between gap-2 rounded-control border border-hairline',
          'bg-surface px-3 text-sm text-ink data-[placeholder]:text-faint',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25',
          'disabled:opacity-50 min-w-[9rem]',
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
          className="z-50 overflow-hidden rounded-control border border-hairline bg-surface shadow-pop"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-[7px] py-1.5 pl-8 pr-3',
                  'text-sm text-ink outline-none data-[highlighted]:bg-raised data-[state=checked]:font-medium',
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
