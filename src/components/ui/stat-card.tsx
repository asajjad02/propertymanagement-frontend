import { cn } from '@/lib/cn';

import { toneClasses, type Tone } from './tones';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** Accent dot tone, e.g. green for "occupied". */
  tone?: Tone;
  className?: string;
}

/** A single metric tile: mono-caps label, large value, optional sub + dot. */
export function StatCard({ label, value, sub, tone, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-hairline rounded-card transition-colors hover:border-muted/40',
        // Mobile tiles are a scannable strip, not a wall: tighter box and a
        // smaller number, so a row of them costs ~80px instead of ~200.
        'min-w-[8.5rem] shrink-0 snap-start px-4 py-3',
        'md:min-w-0 md:shrink md:px-5 md:py-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {tone && <span className={cn('h-1.5 w-1.5 rounded-pill', toneClasses[tone].dot)} />}
        <span className="label-mono truncate">{label}</span>
      </div>
      <div className="display mt-1 text-2xl text-ink tabular-nums md:mt-2.5 md:text-[1.9rem]">
        {value}
      </div>
      {sub != null && <div className="mt-1.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

/**
 * Row wrapper for stat tiles.
 *
 * On mobile this is a horizontally scrolling snap strip rather than a 2-column
 * grid — three tiles in a 2-col grid leaves an orphan on its own row and burns
 * a quarter of the screen before any records. At `md` it's the original grid.
 *
 * If a screen's stats are just the counts of its filter segments, don't render
 * this at all on mobile: pass `count` to `Segmented` instead and let the tabs
 * carry the numbers.
 */
export function StatCardRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-4',
        'md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4',
        className,
      )}
      {...props}
    />
  );
}
