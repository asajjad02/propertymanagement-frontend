'use client';

import { Search } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Text input with a leading search icon. Debounce at the call site if needed. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          // 40px rather than the 44px form-control height: this only ever sits
          // in a list toolbar, where the whole control strip has to stay
          // visually lighter than the record rows under it.
          // text-base is still required — under 16px iOS zooms on focus.
          'h-10 w-full rounded-control border border-hairline bg-surface pl-9 pr-3 text-base text-ink',
          'placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25',
          'md:h-9.5 md:text-sm',
        )}
      />
    </div>
  );
}
