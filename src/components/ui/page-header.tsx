import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Right-aligned actions (buttons, selects). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Page title block — **desktop only** (`lg` and up).
 *
 * Below `lg` the screen's title and actions live in the mobile app bar, which
 * every screen declares with `<PageChrome>`. Rendering this too would repeat
 * the title and spend a row doing it, so the two are mutually exclusive: the
 * app bar shows below `lg`, this shows at `lg` and above.
 *
 * A screen that renders this must also render `<PageChrome>`, or it will have
 * no title on a phone.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'hidden flex-wrap items-start justify-between gap-4 lg:flex',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="display text-[1.75rem] text-ink text-balance">{title}</h1>
        {subtitle != null && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions != null && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
