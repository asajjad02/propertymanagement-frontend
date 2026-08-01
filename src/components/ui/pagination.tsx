'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  /** Total record count (from the API's `count`). */
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Page-based pagination for list tables. ERP work needs stable scanning and
 * "return to where I was", so we paginate rather than infinite-scroll
 * (docs/design/patterns/data-tables.md). Renders a "X–Y of N" range and
 * prev/next controls; hides itself when there's only one page.
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0 || pages === 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-hairline px-3 py-2.5 md:px-4 md:py-3',
        className,
      )}
    >
      {/* The "X–Y of N" range is the first thing to go when width is scarce —
          the page counter beside the arrows already carries position. */}
      <p className="label-mono hidden normal-case tracking-normal sm:block">
        <span className="tabular-nums text-ink-secondary">
          {from}–{to}
        </span>{' '}
        of <span className="tabular-nums text-ink-secondary">{total}</span>
      </p>
      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <PageButton
          label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        <span className="px-2 text-sm text-muted tabular-nums md:text-xs">
          Page {page} / {pages}
        </span>
        <PageButton
          label="Next page"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-control border border-hairline bg-surface',
        'text-muted transition-colors touch-manipulation hover:border-muted/40 hover:text-ink',
        'disabled:pointer-events-none disabled:opacity-40 md:h-8 md:w-8',
      )}
    >
      {children}
    </button>
  );
}
