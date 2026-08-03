'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type Row,
  type RowData,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/lib/cn';

import { EmptyState } from './empty-state';
import { Skeleton, SkeletonRegion } from './skeleton';
import { parseOrdering, SortControl, type SortOption } from './sort-control';

/**
 * Where a column goes when the table collapses to cards below `md`:
 *   primary   — the card's headline (the identifying value)
 *   secondary — the sub-line; several are joined with a middot
 *   caption   — a third, quieter line under the sub-line (a related name)
 *   status    — pinned top-right, for StatusBadge-style cells
 *   meta      — a label/value pair in the card's detail grid
 *   action    — kept outside the tappable area (row menus, chevrons)
 *   hide      — dropped on mobile entirely
 *
 * Prefer primary/secondary/caption/status over `meta`: they produce a three-line
 * card, where a grid of labelled `meta` cells is roughly twice as tall for the
 * same information.
 */
export type MobileRole =
  | 'primary'
  | 'secondary'
  | 'caption'
  | 'status'
  | 'meta'
  | 'action'
  | 'hide';

// Per-column options via ColumnDef.meta:
//  - align: numeric columns → 'right'
//  - sortable: header toggles server-side ordering
//  - sortField: the API `ordering` field name (defaults to the column id)
//  - mobile: the column's role in the mobile card (see MobileRole)
//  - mobileCell: card-only renderer, when the value needs its column header's
//    context inline (a bare "6" reads fine under a FLOOR header but needs to
//    say "Floor 6" on a card, which has no headers)
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right';
    sortable?: boolean;
    sortField?: string;
    mobile?: MobileRole;
    mobileCell?: (row: TData) => React.ReactNode;
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
  /**
   * Render the built-in mobile sort row. Set false when the screen already
   * offers a `SortControl` in its `ListToolbar` — otherwise sorting appears
   * twice and costs a row the list can't spare.
   */
  mobileSort?: boolean;
}

/** Header text when it's a plain string — used for mobile labels and the sort sheet. */
function headerLabel<T>(column: ColumnDef<T, unknown>, fallback: string) {
  return typeof column.header === 'string' && column.header.length > 0 ? column.header : fallback;
}

/**
 * Role for a column that hasn't opted in via `meta.mobile`. Keeps un-annotated
 * tables rendering a sensible card instead of nothing: the first column reads
 * as the headline, header-less columns are chevrons or row menus, and the rest
 * become labelled detail rows.
 */
function inferMobileRole<T>(column: ColumnDef<T, unknown>, index: number): MobileRole {
  if (column.meta?.mobile) return column.meta.mobile;
  const hasHeader = typeof column.header === 'string' ? column.header.length > 0 : column.header != null;
  if (!hasHeader) return 'action';
  return index === 0 ? 'primary' : 'meta';
}

/**
 * Headless TanStack table styled with the design tokens.
 *
 * Two presentations of the same row model: a card list below `md` and the real
 * `<table>` at `md` and up. Both are always rendered and swapped with
 * `display: none`, which also removes the inactive one from the accessibility
 * tree — cheaper and flash-free compared to measuring the viewport in JS. The
 * duplicated DOM is bounded by the page size (20 rows).
 */
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
  mobileSort = true,
}: DataTableProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const active = parseOrdering(ordering);

  // Column id → mobile role, resolved once per column set.
  const roles = useMemo(() => {
    const map = new Map<string, MobileRole>();
    table.getAllLeafColumns().forEach((col, i) => {
      map.set(col.id, inferMobileRole(col.columnDef as ColumnDef<T, unknown>, i));
    });
    return map;
  }, [table]);

  // Sortable columns, in the shape SortControl wants.
  const sortOptions = useMemo<SortOption[]>(
    () =>
      table
        .getAllLeafColumns()
        .filter((c) => c.columnDef.meta?.sortable)
        .map((c) => ({
          field: c.columnDef.meta?.sortField ?? c.id,
          label: headerLabel(c.columnDef as ColumnDef<T, unknown>, c.id),
        })),
    [table],
  );

  const activeSort = sortOptions.find((o) => o.field === active.field);
  const activeSortLabel = activeSort ? `${activeSort.label} ${active.desc ? '↓' : '↑'}` : null;

  if (isLoading) {
    return <TableSkeleton columns={table.getAllLeafColumns().length} roles={roles} />;
  }
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
    <>
      {/* ---- Mobile: card list ------------------------------------------- */}
      <div className="md:hidden">
        {mobileSort && onOrderingChange && sortOptions.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2">
            <p className="label-mono truncate">
              {activeSortLabel ? `Sorted by ${activeSortLabel}` : 'Default order'}
            </p>
            <SortControl
              options={sortOptions}
              ordering={ordering}
              onOrderingChange={onOrderingChange}
            />
          </div>
        )}
        <ul className="divide-y divide-hairline" aria-label={ariaLabel}>
          {table.getRowModel().rows.map((row) => (
            <MobileCard key={row.id} row={row} roles={roles} onRowClick={onRowClick} />
          ))}
        </ul>
      </div>

      {/* ---- Desktop: the table ------------------------------------------ */}
      <div className="hidden overflow-x-auto md:block">
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
                        stickyHeader && 'sticky top-(--topbar-h) z-10 bg-surface',
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(field)}
                          className={cn(
                            'label-mono group inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-ink',
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
    </>
  );
}

/** One record as a tappable card. */
function MobileCard<T>({
  row,
  roles,
  onRowClick,
}: {
  row: Row<T>;
  roles: Map<string, MobileRole>;
  onRowClick?: (row: T) => void;
}) {
  const cells = row.getVisibleCells();
  const pick = (role: MobileRole) => cells.filter((c) => roles.get(c.column.id) === role);

  const primary = pick('primary');
  const secondary = pick('secondary');
  const caption = pick('caption');
  const status = pick('status');
  const metaCells = pick('meta');
  const actions = pick('action');

  // A column can supply a card-specific renderer; otherwise reuse the table cell.
  const render = (cell: Cell<T, unknown>) => {
    const mobileCell = cell.column.columnDef.meta?.mobileCell;
    return mobileCell
      ? mobileCell(row.original)
      : flexRender(cell.column.columnDef.cell, cell.getContext());
  };
  const interactive = !!onRowClick;

  return (
    <li className="flex items-stretch bg-surface">
      <div
        {...(interactive
          ? {
              role: 'button' as const,
              tabIndex: 0,
              onClick: () => onRowClick(row.original),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(row.original);
                }
              },
            }
          : {})}
        className={cn(
          'flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5',
          interactive &&
            'touch-manipulation transition-colors active:bg-raised focus-visible:outline-none focus-visible:bg-raised',
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          {primary.map((cell) => (
            <div key={cell.id} className="truncate text-[0.9375rem] font-medium text-ink">
              {render(cell)}
            </div>
          ))}

          {secondary.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
              {secondary.map((cell, i) => (
                <span key={cell.id} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden className="text-faint">·</span>}
                  {render(cell)}
                </span>
              ))}
            </p>
          )}

          {caption.length > 0 && (
            <p className="truncate text-sm text-ink-secondary">
              {caption.map((cell) => (
                <span key={cell.id}>{render(cell)}</span>
              ))}
            </p>
          )}

          {metaCells.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1.5">
              {metaCells.map((cell) => (
                <div key={cell.id} className="min-w-0">
                  <dt className="label-mono">
                    {headerLabel(cell.column.columnDef as ColumnDef<T, unknown>, cell.column.id)}
                  </dt>
                  <dd
                    className={cn(
                      'truncate text-sm text-ink-secondary',
                      cell.column.columnDef.meta?.align === 'right' && 'tabular-nums',
                    )}
                  >
                    {render(cell)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {(status.length > 0 || (interactive && actions.length === 0)) && (
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {status.map((cell) => (
              <span key={cell.id}>{render(cell)}</span>
            ))}
            {interactive && actions.length === 0 && (
              <ChevronRight className="h-4 w-4 text-faint" aria-hidden />
            )}
          </div>
        )}
      </div>

      {/* Row menus live outside the tappable region: nesting a button inside a
          role="button" is invalid, and a stray tap shouldn't navigate away. */}
      {actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 pr-3">
          {actions.map((cell) => (
            <span key={cell.id}>{render(cell)}</span>
          ))}
        </div>
      )}
    </li>
  );
}


/**
 * Loading placeholder shaped like the table it replaces — card rows below `md`,
 * header + table rows above. Sized from the real column set, so the page
 * doesn't reflow when the data lands. Rows use varied widths: a column of
 * identical bars reads as a progress indicator rather than as content.
 */
const ROW_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-16', 'w-24', 'w-20'];

function TableSkeleton({ columns, roles }: { columns: number; roles: Map<string, MobileRole> }) {
  const rows = 6;
  // The mobile card shows a headline plus however many lines the roles imply.
  const hasCaption = [...roles.values()].includes('caption');

  return (
    <SkeletonRegion label="Loading records…">
      {/* Mobile: card rows */}
      <ul className="divide-y divide-hairline md:hidden">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className={cn('h-4', ROW_WIDTHS[i % ROW_WIDTHS.length])} />
              <Skeleton className="h-3.5 w-32" />
              {hasCaption && <Skeleton className="h-3.5 w-24" />}
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-pill" />
          </li>
        ))}
      </ul>

      {/* Desktop: header + table rows */}
      <div className="hidden md:block">
        <div className="flex gap-4 border-b border-hairline px-4 py-2.5">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-2.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-0">
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-24')} />
            ))}
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}
