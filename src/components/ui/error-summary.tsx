'use client';

import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A top-of-form error summary for multi-error submits (GOV.UK pattern; see
 * docs/design/patterns/forms.md and accessibility.md §Forms). Announces
 * assertively (`role="alert"`) so screen-reader users hear that the submit
 * failed and why. Renders nothing when there are no messages. Individual field
 * errors still show inline via `Field`; this is the summary above the form.
 */
export function ErrorSummary({
  messages,
  title = 'Please fix the following',
  className,
}: {
  messages: string[];
  title?: string;
  className?: string;
}) {
  const items = messages.filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-2.5 rounded-control border border-danger/30 bg-danger-soft px-3.5 py-3',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {items.length === 1 ? (
          <p className="mt-0.5 text-sm text-ink-secondary">{items[0]}</p>
        ) : (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-secondary">
            {items.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
