import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/cn';

export interface DetailHeaderProps {
  title: string;
  /** Href for the back link (e.g. the parent list). */
  backHref?: string;
  backLabel?: string;
  /** Status pill / badge shown next to the title. */
  status?: React.ReactNode;
  /** Small meta line under the title. */
  meta?: React.ReactNode;
  /** Avatar or icon shown to the left of the title. */
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Detail-page header: optional back link, leading avatar, title + status + meta, actions. */
export function DetailHeader({
  title,
  backHref,
  backLabel = 'Back',
  status,
  meta,
  leading,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {leading}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl leading-tight text-ink">{title}</h1>
              {status}
            </div>
            {meta != null && <div className="mt-1 text-sm text-muted">{meta}</div>}
          </div>
        </div>
        {actions != null && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
