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
        'bg-surface border border-hairline rounded-card px-5 py-4 transition-colors hover:border-muted/40',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {tone && <span className={cn('h-1.5 w-1.5 rounded-pill', toneClasses[tone].dot)} />}
        <span className="label-mono">{label}</span>
      </div>
      <div className="display mt-2.5 text-[1.9rem] text-ink tabular-nums">{value}</div>
      {sub != null && <div className="mt-1.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

/** Row wrapper that lays stat cards out in a responsive grid. */
export function StatCardRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid gap-3 grid-cols-2 lg:grid-cols-4', className)}
      {...props}
    />
  );
}
