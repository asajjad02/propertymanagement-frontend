'use client';

import { useQueries } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import * as api from '@/api/endpoints';
import { BillSheetSet } from '@/components/billing/bill-sheet-set';
import { byFlatNumber, selectLiveBills, takeStashedBills } from '@/lib/live-bills';

const stateStyle = { padding: 40, fontFamily: 'system-ui', color: '#6b6760' } as const;

function PrintAllBills() {
  const search = useSearchParams();

  /*
   * Taken once, on mount: the dialog that opened this tab has usually already
   * fetched every bill, so this renders immediately instead of repeating the work.
   * Read in state rather than inline — it clears the stash, so a re-render must not
   * come back empty-handed.
   */
  const [stashed] = useState(takeStashedBills);

  // Both statuses, because "newest per flat" can't be decided from the issued
  // ones alone: a flat whose newest bill is paid must print nothing, not fall
  // back to an older unpaid one. Skipped entirely when the stash arrived.
  const lists = useQueries({
    queries: (['issued', 'paid'] as const).map((status) => ({
      queryKey: ['electricity-bills', 'print-all', status],
      // Per-viewset filterset_fields go under `filters` (see types/http.ts).
      queryFn: () => api.electricityBills.listAll({ filters: { status } }),
      enabled: !stashed,
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

  // Opened straight from the dialog: everything is already in hand.
  if (stashed) {
    return <BillSheetSet bills={stashed} auto={search.get('auto') === '1'} />;
  }

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
