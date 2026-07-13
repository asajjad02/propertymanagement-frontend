'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/cn';

import { EmptyState } from './empty-state';
import { LoadingBlock } from './spinner';

// Per-column options via ColumnDef.meta:
//  - align: numeric columns → 'right'
//  - sortable: header toggles server-side ordering
//  - sortField: the API `ordering` field name (defaults to the column id)
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right';
    sortable?: boolean;
    sortField?: string;
  }
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /**
   * Server-side sort. `ordering` is the DRF ordering string (e.g. `flat_number`
   * or `-billing_period_end`); pass it straight to the list query. When set with
   * `onOrderingChange`, sortable headers become interactive.
   */
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  /** Freeze the header row while the page scrolls (below the sticky topbar). */
  stickyHeader?: boolean;
  /** Accessible caption/name for the table. */
  ariaLabel?: string;
}

function parseOrdering(ordering: string | null | undefined) {
  if (!ordering) return { field: null as string | null, desc: false };
  return ordering.startsWith('-')
    ? { field: ordering.slice(1), desc: true }
    : { field: ordering, desc: false };
}

/** Headless TanStack table styled with the design tokens. Optional server-side sort. */
export function DataTable<T>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  ordering,
  onOrderingChange,
  stickyHeader = false,
  ariaLabel,
}: DataTableProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const active = parseOrdering(ordering);

  if (isLoading) return <LoadingBlock />;
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  function toggleSort(field: string) {
    if (!onOrderingChange) return;
    // Cycle: asc → desc → cleared.
    if (active.field !== field) onOrderingChange(field);
    else if (!active.desc) onOrderingChange(`-${field}`);
    else onOrderingChange(null);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" aria-label={ariaLabel}>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-hairline">
              {group.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                const right = meta?.align === 'right';
                const field = meta?.sortField ?? header.column.id;
                const sortable = !!meta?.sortable && !!onOrderingChange;
                const isActive = sortable && active.field === field;
                const ariaSort = isActive ? (active.desc ? 'descending' : 'ascending') : undefined;
                const content = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext());
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      'label-mono px-4 py-2.5 font-normal',
                      right ? 'text-right' : 'text-left',
                      stickyHeader && 'sticky top-14 z-10 bg-surface',
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(field)}
                        className={cn(
                          'label-mono group inline-flex items-center gap-1 transition-colors hover:text-ink',
                          right && 'flex-row-reverse',
                          isActive && 'text-ink',
                        )}
                      >
                        {content}
                        {isActive ? (
                          active.desc ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronUp className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </button>
                    ) : (
                      content
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                'border-b border-hairline last:border-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-raised',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'px-4 py-3 text-ink-secondary align-middle',
                    cell.column.columnDef.meta?.align === 'right' && 'text-right tabular-nums',
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
