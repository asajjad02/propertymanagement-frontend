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
            'inline-flex h-11 min-w-[9rem] items-center justify-between gap-2 rounded-control border border-hairline',
            'bg-surface px-3 text-base text-ink transition-colors hover:border-muted/40 touch-manipulation',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50',
            'md:h-9.5 md:text-sm',
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
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Autofocusing the filter field summons the on-screen keyboard the
            // moment the popover opens, which on a phone leaves almost no room
            // for the list it is meant to filter. Let the user tap to search.
            if (window.matchMedia('(min-width: 768px)').matches) inputRef.current?.focus();
          }}
          className={cn(
            'z-50 overflow-hidden rounded-control border border-hairline bg-surface shadow-pop',
            'w-[min(22rem,calc(100vw-1.5rem))] md:w-[min(22rem,var(--radix-popover-trigger-width,18rem))]',
          )}
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
              // text-base on mobile prevents iOS focus-zoom (see input.tsx).
              className="h-11 w-full bg-transparent text-base text-ink placeholder:text-faint focus:outline-none md:h-9 md:text-sm"
            />
          </div>
          <ul className="max-h-[min(16rem,45dvh)] overflow-y-auto overscroll-contain p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => choose(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2.5 text-left text-base text-ink',
                    'hover:bg-raised md:py-1.5 md:text-sm',
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
