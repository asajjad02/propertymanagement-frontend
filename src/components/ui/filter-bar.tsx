import { cn } from '@/lib/cn';

/**
 * Layout wrapper for list filters: segmented control(s) on the left, search /
 * selects on the right. Compose with Segmented, Select, SearchInput.
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
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}
