import type { ElectricityBill } from '@/types/api';

/**
 * The newest non-draft bill per flat, kept only while it's still `issued` — the
 * set that gets printed and handed out.
 *
 * Three exclusions fall out of this rather than needing a flag:
 *
 *  - **Superseded bills.** Issuing a bill rolls the flat's unpaid balance into the
 *    new one's `previous_outstanding`, so the newest bill already asks for
 *    everything the older ones did. Printing both would put the same money on
 *    paper twice.
 *  - **Paid flats.** Nothing owed, nothing to hand over — including when the paid
 *    bill is newer than an unpaid one, because paying it settled the arrears it
 *    carried.
 *  - **Drafts.** No reading and no amounts; the sheet would be a statement for
 *    Rs 0.00.
 *
 * Deliberately not selected by billing period. Periods in real data aren't all
 * calendar months — one account has bills running 2026-07-04 to 2026-08-04, and
 * others covering a single day — so asking for "this month" returned one bill out
 * of seventy-four. What gets handed out is each flat's current statement, whatever
 * period it happens to cover.
 */
export function selectLiveBills(bills: ElectricityBill[]): ElectricityBill[] {
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

/** Natural order, so B-10 follows B-9 — the order the app lists flats in. */
export function byFlatNumber(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true });
}

/*
 * Handing the prepared bills to the print tab.
 *
 * The dialog does the fetching so progress is visible where the click happened;
 * the print tab then needs the result without fetching it all again. localStorage
 * rather than sessionStorage: a tab opened with `noopener` doesn't inherit the
 * opener's session storage, and dropping `noopener` to work around that would
 * hand the new tab a reference back to this one.
 *
 * Written immediately before opening the tab and consumed on arrival, so nothing
 * is left behind. If it's missing or unreadable — quota, private mode, a stale
 * link — the route falls back to fetching, so the handoff is an optimisation and
 * never the only path.
 */
const HANDOFF_KEY = 'print-bills-handoff';

export function stashBillsForPrint(bills: Record<string, string>[]) {
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(bills));
  } catch {
    // Over quota (a logo as a data URI across many bills would do it) or storage
    // unavailable. The print route fetches instead — slower, still correct.
  }
}

export function takeStashedBills(): Record<string, string>[] | null {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    localStorage.removeItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as Record<string, string>[])
      : null;
  } catch {
    return null;
  }
}
