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

/**
 * Detail-page header.
 *
 * Two presentations. At `lg` and up: the full block — back link, leading
 * avatar, large title, status, meta, actions. Below `lg` the app bar already
 * carries the back chevron and the record's name (via `<PageChrome>`), so this
 * collapses to the parts the bar can't hold — status, meta and actions — as one
 * compact strip. Repeating the title underneath a bar that already shows it is
 * the single most common way a web page gives itself away on a phone.
 */
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
  const hasMobileContent = status != null || meta != null || actions != null;

  return (
    <>
      {/* ---- Mobile: status + meta + actions only ------------------------
           Status and meta identify the record; actions get their own row
           rather than being squeezed alongside them at 390px. */}
      {hasMobileContent && (
        <div className={cn('space-y-2.5 lg:hidden', className)}>
          {(status != null || meta != null) && (
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
              {status}
              {meta != null && <span className="truncate text-sm text-muted">{meta}</span>}
            </div>
          )}
          {actions != null && (
            <div className="flex flex-wrap items-center gap-2 *:flex-1 [&>*]:min-w-fit">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* ---- Desktop: the full header ------------------------------------ */}
      <div className={cn('hidden space-y-3 lg:block', className)}>
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
                <h1 className="display text-[1.75rem] text-ink">{title}</h1>
                {status}
              </div>
              {meta != null && <div className="mt-1 text-sm text-muted">{meta}</div>}
            </div>
          </div>
          {actions != null && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </>
  );
}
