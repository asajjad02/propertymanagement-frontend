import { cn } from '@/lib/cn';

/**
 * A placeholder shaped like the content that's coming.
 *
 * Prefer this over a centred spinner for anything with a known layout: it keeps
 * the page's structure stable, so nothing jumps when the data lands, and it
 * tells the user what they're waiting for rather than just that they're
 * waiting.
 *
 * The whole loading region should carry one `aria-busy` container with a
 * `sr-only` label — the individual blocks are decorative and hidden from
 * assistive tech (see `SkeletonRegion`).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton h-4 w-full', className)} />;
}

/**
 * Wrapper announcing a loading region once, instead of letting a screen reader
 * wade through a dozen meaningless placeholder blocks.
 */
export function SkeletonRegion({
  label = 'Loading…',
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Placeholder matching a `StatCard`'s label + value. */
export function StatCardSkeleton() {
  return (
    <div
      className={cn(
        'bg-surface border border-hairline rounded-card',
        'min-w-[8.5rem] shrink-0 snap-start px-4 py-3 md:min-w-0 md:shrink md:px-5 md:py-4',
      )}
    >
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="mt-2.5 h-7 w-12 md:mt-3.5 md:h-8" />
    </div>
  );
}

/**
 * Placeholder for a detail screen: the status strip, then two stacked panels.
 * Matches the real shape closely enough that the page doesn't reflow when the
 * record arrives.
 */
export function DetailSkeleton() {
  return (
    <SkeletonRegion label="Loading record…" className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-24 rounded-pill" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* The tab strip: varied widths so it reads as labels, not a progress bar. */}
      <div className="flex gap-5 border-b border-hairline pb-3">
        {['w-16', 'w-12', 'w-20', 'w-14'].map((w) => (
          <Skeleton key={w} className={cn('h-4 shrink-0', w)} />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-card border border-hairline bg-surface">
          <div className="border-b border-hairline px-5 py-4">
            <Skeleton className="h-2.5 w-32" />
          </div>
          <div className="space-y-4 p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}
