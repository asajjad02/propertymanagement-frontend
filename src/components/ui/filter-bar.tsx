import { cn } from '@/lib/cn';

/**
 * Layout wrapper for list filters: segmented control(s) on the left, search /
 * selects on the right. Compose with Segmented, Select, SearchInput.
 *
 * Mobile stacks the two slots and lets each control span the row — a wrapped
 * grid of half-width selects is the shape that made the old filter area read
 * as a pile. Everything returns to a single justified row at `md`.
 *
 * When a screen has more than about two filters, move them behind
 * `FilterSheet` instead of growing this stack.
 */
export function FilterBar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between',
        className,
      )}
    >
      {left != null && <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>}
      {right != null && (
        <div
          className={cn(
            'flex flex-col gap-2 [&>*]:w-full',
            'sm:flex-row sm:flex-wrap sm:items-center sm:[&>*]:w-auto',
          )}
        >
          {right}
        </div>
      )}
    </div>
  );
}
