import { cn } from '@/lib/cn';

/**
 * The Cancel/Save row at the foot of a form.
 *
 * Forms render their own actions rather than passing them to `Modal`'s footer
 * slot, so this — not the sheet footer — is the button row you actually see in
 * a dialog. It follows the same rule: two actions share the row, three or more
 * stack (labels like "Save & add another" wrap to two lines at a third of a
 * 390px screen), and desktop is always a right-aligned row of natural-width
 * buttons.
 *
 * Reversed when stacked so the primary action — last in DOM order, which is
 * what keyboard tab order should see — renders on top, nearest the thumb.
 */
export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 pt-1 *:flex-1',
        // Scoped to `max-sm` rather than overridden at `sm`: a `:has()` selector
        // carries an extra specificity point, so `sm:flex-row` would lose to
        // `has-[…]:flex-col-reverse` no matter which came later in the sheet.
        // `flex:1 1 0%` on a column child also zeroes its basis and can collapse
        // the auto-height row, so the stacked case resets it.
        'max-sm:has-[>:nth-child(3)]:flex-col-reverse',
        'max-sm:has-[>:nth-child(3)]:items-stretch',
        'max-sm:has-[>:nth-child(3)]:*:flex-none',
        'sm:justify-end sm:*:flex-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
