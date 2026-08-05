'use client';

import { Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Print every live bill as one document.
 *
 * Printing is a real delivery path — plenty of flats have an owner to hand a
 * sheet to and no email on file — and doing it a bill at a time meant seventy-odd
 * downloads and as many trips to the printer.
 *
 * Opens the chrome-free `/print/bills` route, which prints itself once fonts and
 * images settle (`?auto=1`) — the same shape as the single-bill Print action, and
 * deliberately so: both render the account's branded template through the same
 * `fillBill` path, so a bulk print and an individual bill are the same sheet.
 *
 * It used to download a server-rendered PDF for one billing period, which was
 * wrong twice over: that PDF was the old pre-branding layout, and asking for a
 * calendar month matched one bill out of seventy-four, because real billing
 * periods aren't all calendar months. Which bills count is now decided by status
 * — see the route for the rule and why.
 */
export function PrintRoundButton({
  variant = 'secondary',
  className,
}: {
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      className={className}
      // A plain link would be fine for the route itself, but the bills it fetches
      // are authenticated — so it opens the app route, which carries the session,
      // rather than a bare file URL.
      onClick={() => window.open('/print/bills?auto=1', '_blank', 'noopener')}
    >
      <Printer className="h-4 w-4" />
      Print all bills
    </Button>
  );
}
