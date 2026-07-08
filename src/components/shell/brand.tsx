import { cn } from '@/lib/cn';

/** Hash Residency brand mark: indigo "H" tile + wordmark (hidden when collapsed). */
export function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary text-[1.05rem] font-semibold tracking-tight text-white shadow-hair">
        H
      </div>
      <span className={cn('font-semibold tracking-[-0.01em] text-ink whitespace-nowrap', collapsed && 'hidden')}>
        Hash Residency
      </span>
    </div>
  );
}
