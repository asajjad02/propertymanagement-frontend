'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

import type { SelectOption } from './select';

/**
 * A type-to-filter single-select (combobox) — recognition over recall
 * (docs/design/ux-principles.md). Use for large option sets like flats,
 * people, or staff where a plain scroll is too slow. Same value/onValueChange
 * shape as `Select`; adds an in-popover search field.
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  id,
  disabled,
  className,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function choose(v: string) {
    onValueChange(v);
    setOpen(false);
    setQuery('');
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex h-9.5 min-w-[9rem] items-center justify-between gap-2 rounded-control border border-hairline',
            'bg-surface px-3 text-sm text-ink transition-colors hover:border-muted/40',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-faint')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="z-50 w-[min(22rem,var(--radix-popover-trigger-width,18rem))] overflow-hidden rounded-control border border-hairline bg-surface shadow-pop"
        >
          <div className="flex items-center gap-2 border-b border-hairline px-3">
            <Search className="h-4 w-4 text-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered[0]) {
                  e.preventDefault();
                  choose(filtered[0].value);
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => choose(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-sm text-ink',
                    'hover:bg-raised',
                    opt.value === value && 'font-medium',
                  )}
                >
                  <Check className={cn('h-4 w-4 text-primary', opt.value === value ? 'opacity-100' : 'opacity-0')} />
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
