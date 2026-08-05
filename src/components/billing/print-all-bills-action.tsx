'use client';

import { useQueries } from '@tanstack/react-query';
import { Download, ExternalLink, Printer } from 'lucide-react';
import { useState } from 'react';

import * as api from '@/api/endpoints';
import { AppBarAction } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { byFlatNumber, selectLiveBills, stashBillsForPrint } from '@/lib/live-bills';

/**
 * "Print all bills" — prepares every live bill, then hands over.
 *
 * The preparation happens in a dialog on the page you clicked from, not on a
 * fresh page that sits blank while it loads. On a phone, opening a new tab to
 * watch a progress line is the wrong shape: you lose your place, and a
 * half-loaded print view looks broken. So the count runs here, and the tab only
 * opens once there's something to show in it.
 *
 * Registers a mobile bar action as well as the desktop button. The page header's
 * actions are `lg`-and-up, so on a phone this was simply unreachable.
 *
 * "View" and "Save as PDF" both open the print route, which is already populated
 * from the handoff (see lib/live-bills) so it renders immediately. Save adds
 * `?auto=1`, which opens the browser's print sheet — that's where "Save as PDF"
 * lives on desktop and mobile alike. There's no server-rendered file to download
 * instead: the bill is the account's branded template rendered by the browser,
 * which is exactly why it looks right.
 */
export function PrintAllBillsAction({
  variant = 'secondary',
  className,
}: {
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // Nothing is fetched until the dialog opens — this is a once-a-month action, and
  // it would otherwise cost every visitor to the bills screen a dozen requests.
  const lists = useQueries({
    queries: (['issued', 'paid'] as const).map((status) => ({
      queryKey: ['electricity-bills', 'print-all', status],
      queryFn: () => api.electricityBills.listAll({ filters: { status } }),
      enabled: open,
    })),
  });
  const listsSettled = open && lists.every((q) => q.isSuccess);
  const live = selectLiveBills(listsSettled ? lists.flatMap((q) => q.data ?? []) : []);

  const tokenQueries = useQueries({
    queries: live.map((bill) => ({
      queryKey: ['bills', bill.id, 'tokens'],
      queryFn: () => api.fetchBillTokens(bill.id),
      enabled: open,
    })),
  });

  const ready = tokenQueries
    .map((q) => q.data)
    .filter((t): t is Record<string, string> => !!t)
    .sort((a, b) => byFlatNumber(a.apt ?? '', b.apt ?? ''));
  const failed = tokenQueries.filter((q) => q.isError).length;
  const done = live.length > 0 && ready.length + failed === live.length;

  function handOver(auto: boolean) {
    stashBillsForPrint(ready);
    window.open(auto ? '/print/bills?auto=1' : '/print/bills', '_blank', 'noopener');
    setOpen(false);
  }

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <Printer className="h-4 w-4" />
        Print all bills
      </Button>

      {/* The header's actions are desktop-only, so the phone needs its own. */}
      <AppBarAction icon={Printer} label="Print all" onClick={() => setOpen(true)} />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Print all bills"
        description={
          done
            ? 'One page per flat, in the account’s bill template.'
            : 'Collecting each flat’s current bill.'
        }
      >
        <div className="space-y-4">
          {!listsSettled ? (
            <Progress label="Finding bills to print…" />
          ) : live.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing to print — no flat has an issued bill outstanding. Paid and draft
              bills aren’t included.
            </p>
          ) : !done ? (
            <Progress
              label={`Preparing ${live.length} bills`}
              value={ready.length + failed}
              total={live.length}
            />
          ) : (
            <>
              <p className="text-sm text-ink">
                <span className="font-semibold tabular-nums">{ready.length}</span>{' '}
                {ready.length === 1 ? 'bill' : 'bills'} ready
                {failed > 0 && (
                  <span className="text-warn">
                    {' '}
                    · {failed} couldn’t be loaded and {failed === 1 ? 'is' : 'are'} not
                    included
                  </span>
                )}
              </p>
              {/* Stacked and full-width: these are the two thumb targets that
                  matter, and on a phone a side-by-side pair of them is cramped. */}
              <div className="flex flex-col gap-2 md:flex-row">
                <Button
                  variant="secondary"
                  className="md:flex-1"
                  disabled={ready.length === 0}
                  onClick={() => handOver(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
                <Button
                  className="md:flex-1"
                  disabled={ready.length === 0}
                  onClick={() => handOver(true)}
                >
                  <Download className="h-4 w-4" />
                  Save as PDF
                </Button>
              </div>
              <p className="text-xs text-muted">
                Save as PDF opens your print sheet — choose “Save as PDF” there to get
                one file with every bill in it.
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

/** Determinate when a total is known, indeterminate while still counting. */
function Progress({ label, value, total }: { label: string; value?: number; total?: number }) {
  const pct = total && total > 0 ? Math.round(((value ?? 0) / total) * 100) : null;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink">{label}</p>
        {pct !== null && (
          <p className="label-mono shrink-0 tabular-nums">
            {value} / {total}
          </p>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 overflow-hidden rounded-pill bg-raised"
      >
        <div
          className={
            pct === null
              ? 'h-full w-1/3 animate-pulse rounded-pill bg-primary'
              : 'h-full rounded-pill bg-primary transition-[width] duration-300'
          }
          style={pct === null ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
