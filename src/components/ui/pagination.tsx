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
        'flex items-center justify-between gap-4 border-t border-hairline px-4 py-3',
        className,
      )}
    >
      <p className="label-mono normal-case tracking-normal">
        <span className="tabular-nums text-ink-secondary">
          {from}–{to}
        </span>{' '}
        of <span className="tabular-nums text-ink-secondary">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageButton
          label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        <span className="px-2 text-xs text-muted tabular-nums">
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
      className="rounded-control border border-hairline bg-surface p-1.5 text-muted transition-colors hover:border-muted/40 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
