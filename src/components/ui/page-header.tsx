import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Right-aligned actions (buttons, selects). */
  actions?: React.ReactNode;
  className?: string;
}

/** Page title block: serif display title, muted subtitle, actions slot. */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        <h1 className="display text-[1.75rem] text-ink text-balance">{title}</h1>
        {subtitle != null && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions != null && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
