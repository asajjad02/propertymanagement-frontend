'use client';

import { Printer } from 'lucide-react';
import { useState } from 'react';

import * as api from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { toApiError } from '@/lib/errors';

/**
 * Print a whole month's bills as one document.
 *
 * Printing is a real delivery path — plenty of flats have an owner to hand a
 * sheet to and no email on file — and doing it a bill at a time meant sixty-six
 * downloads and sixty-six trips to the printer. The server returns one PDF with
 * a page per issued bill, in flat-number order, so this is one action.
 *
 * Drafts aren't in it: a draft has no readings and no amounts, so its sheet would
 * be a blank statement, which is worse than a missing one.
 */
export function PrintRoundButton({
  month,
  variant = 'secondary',
  className,
}: {
  /** `YYYY-MM`. */
  month: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const toast = useToast();
  const [working, setWorking] = useState(false);

  async function onPrint() {
    setWorking(true);
    try {
      // Fetched rather than linked: the endpoint is authenticated, so a bare
      // href would land on a 401 instead of the bills.
      const blob = await api.downloadRoundPdf(month);
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, '_blank');
      if (!tab) {
        // Popup blocked — fall back to a download so the bills still get out.
        const link = document.createElement('a');
        link.href = url;
        link.download = `bills-${month}.pdf`;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error('Could not open the bills', toApiError(err).message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Button variant={variant} loading={working} disabled={working} onClick={onPrint} className={className}>
      <Printer className="h-4 w-4" />
      Print all bills
    </Button>
  );
}
