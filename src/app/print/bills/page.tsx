'use client';

import { useQueries } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import * as api from '@/api/endpoints';
import { BillSheetSet } from '@/components/billing/bill-sheet-set';
import type { ElectricityBill } from '@/types/api';

const stateStyle = { padding: 40, fontFamily: 'system-ui', color: '#6b6760' } as const;

/** Natural order, so B-10 follows B-9 — the order the app lists flats in. */
function byFlatNumber(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true });
}

/**
 * The newest non-draft bill per flat, kept only while it's still `issued`.
 *
 * Pure, so the rule is readable and testable on its own rather than tangled with
 * query state.
 */
function selectLiveBills(bills: ElectricityBill[]): ElectricityBill[] {
  const newest = new Map<number, ElectricityBill>();
  for (const bill of bills) {
    const held = newest.get(bill.flat);
    // Later period wins; id breaks a tie, matching the server's own ordering.
    const isNewer =
      !held ||
      bill.billing_period_end > held.billing_period_end ||
      (bill.billing_period_end === held.billing_period_end && bill.id > held.id);
    if (isNewer) newest.set(bill.flat, bill);
  }
  return [...newest.values()].filter((b) => b.status === 'issued');
}

/**
 * Every live bill, each on its own A4 sheet, in the account's branded template.
 * `?auto=1` prints itself.
 *
 * "Live" is the newest non-draft bill per flat, and only while it's still
 * `issued`. Three deliberate exclusions fall out of that:
 *
 *  - **Superseded bills.** Issuing a bill rolls the flat's unpaid balance into the
 *    new one's `previous_outstanding`, so the newest bill already asks for
 *    everything the older ones did. Printing both would put the same money on
 *    paper twice.
 *  - **Paid flats.** Nothing is owed, so there's nothing to hand over — including
 *    when the paid bill is newer than an unpaid one, since paying it settled the
 *    arrears it carried.
 *  - **Drafts.** No reading and no amounts; the sheet would be a statement for
 *    Rs 0.00.
 *
 * Selecting by billing period was the previous approach and it was wrong twice
 * over. Periods in real data aren't all calendar months — this account has bills
 * running 2026-07-04 to 2026-08-04, and others covering a single day — so asking
 * for "this month" returned one bill out of seventy-four. And the question itself
 * was wrong: what gets handed out is each flat's current statement, whatever
 * period it happens to cover.
 */
function PrintAllBills() {
  const search = useSearchParams();

  // Both statuses, because "newest per flat" can't be decided from the issued
  // ones alone: a flat whose newest bill is paid must print nothing, not fall
  // back to an older unpaid one.
  const lists = useQueries({
    queries: (['issued', 'paid'] as const).map((status) => ({
      queryKey: ['electricity-bills', 'print-all', status],
      // Per-viewset filterset_fields go under `filters` (see types/http.ts).
      queryFn: () => api.electricityBills.listAll({ filters: { status } }),
    })),
  });

  const listsSettled = lists.every((q) => q.isSuccess);

  // Computed plainly, not memoised: it's a reduce over a few dozen rows, and the
  // inputs are new arrays on every render anyway, so a memo would recompute while
  // costing a dependency list that lies about what it reads.
  const live = selectLiveBills(listsSettled ? lists.flatMap((q) => q.data ?? []) : []);

  // One token fetch per bill. This is a click made once a month, and it's the
  // same endpoint the single-bill print uses, so the sheets are identical.
  const tokenQueries = useQueries({
    queries: live.map((bill) => ({
      queryKey: ['bills', bill.id, 'tokens'],
      queryFn: () => api.fetchBillTokens(bill.id),
    })),
  });

  const loadedTokens = tokenQueries
    .map((q) => q.data)
    .filter((t): t is Record<string, string> => !!t)
    .sort((a, b) => byFlatNumber(a.apt ?? '', b.apt ?? ''));

  const failed = tokenQueries.filter((q) => q.isError).length;
  const pending = tokenQueries.filter((q) => q.isPending).length;

  if (!listsSettled) return <p style={stateStyle}>Finding bills to print…</p>;
  if (live.length === 0) {
    return (
      <p style={stateStyle}>
        Nothing to print — no flat has an issued bill outstanding. A paid or draft bill
        isn&apos;t printed.
      </p>
    );
  }
  // Held back until every bill is in: printing at 40 of 74 would look complete and
  // quietly drop the rest.
  if (pending > 0) {
    return (
      <p style={stateStyle}>
        Preparing {live.length} bills… {live.length - pending} ready
      </p>
    );
  }
  if (loadedTokens.length === 0) {
    return <p style={stateStyle}>Could not load these bills.</p>;
  }

  return (
    <>
      {failed > 0 && (
        <p style={{ ...stateStyle, paddingBottom: 0, color: '#b7791f' }}>
          {failed} of {live.length} bills couldn&apos;t be loaded and are not included.
        </p>
      )}
      <BillSheetSet bills={loadedTokens} auto={search.get('auto') === '1'} />
    </>
  );
}

export default function PrintAllBillsPage() {
  // useSearchParams needs a Suspense boundary during prerender (Next App Router).
  return (
    <Suspense fallback={<p style={stateStyle}>Loading bills…</p>}>
      <PrintAllBills />
    </Suspense>
  );
}
