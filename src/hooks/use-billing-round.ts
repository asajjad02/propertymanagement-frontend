'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchBillingRound, fetchOutstanding } from '@/api/endpoints';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { queryKeys } from '@/lib/query-keys';
import type { ElectricityBill, Flat } from '@/types/api';

/** Matches billing/services.py, so the round and the 400 read the same. */
const APARTMENT_TYPE_BLOCKED =
  'This flat has no apartment type, so its maintenance charge is unknown.';

/** `YYYY-MM` — the month a billing round covers. */
export type MonthKey = string;

export function monthKeyOf(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** One stop on the round: a flat, and its bill for the chosen month. */
export interface RoundStop {
  flatId: number;
  flatNumber: string;
  /**
   * The flat's one meter. Needed to write an opening reading to it the first time
   * a flat is read — the bill takes its baseline from the meter, so that's where
   * the number has to land.
   */
  meterId: number;
  /** What a new reading will be measured against. */
  previousReading: string;
  /** This month's bill, at any status. Null until a draft is created. */
  bill: ElectricityBill | null;
  /** Already read this month — the bill exists and has left draft. */
  read: boolean;
  /**
   * Why this stop can't be billed yet, or null. Server-decided, because the
   * server is what will refuse it: a flat with no apartment type has no
   * maintenance basis, and no configured rate means no electricity charge.
   *
   * Surfaced on the row so the round says so before anyone walks to the meter,
   * rather than 400-ing once the photo is taken and the reading typed.
   */
  blocked: string | null;
  /**
   * What kind of problem `blocked` is, so the row can offer the fix rather than
   * only naming it. A missing apartment type is fixed on the flat; a missing rate
   * is a building-wide setting and isn't.
   */
  blockedKind: 'apartment_type' | 'rate' | null;
  /** The flat itself, so a row can edit it in place. */
  flat: Flat;
}

/**
 * A billing round: one month × every flat that has a meter.
 *
 * Read from `GET /billing/rounds/{month}/`, which joins it server-side. This used
 * to be assembled here from flats + meters + *every bill ever raised*, walked
 * twenty rows per request — a cost that grew every month and was paid on a phone,
 * on mobile data, at the start of every round.
 *
 * The flats lookup stays, only to hand a row the Flat it needs to edit in place.
 * That one is bounded by the size of the property and shared with every other
 * screen, so it was never the part that grew.
 *
 * Vacant flats are in the round too. Maintenance is owed on a flat whether or not
 * anyone lives in it, and skipping a vacant flat also skipped its meter reading,
 * so the next occupant inherited a baseline nobody had checked.
 *
 * Shared by the meter round and the Overview so the two always report the same
 * progress. Both queries are cached, so a second caller costs nothing.
 */
export function useBillingRound(month: MonthKey) {
  const flats = useFlatsLookup();
  const round = useQuery({
    queryKey: queryKeys.billing.round(month),
    queryFn: () => fetchBillingRound(month),
  });

  const stops = useMemo<RoundStop[]>(() => {
    const byId = flats.map;
    return (round.data?.stops ?? [])
      .filter((s) => s.meter != null)
      .map((s): RoundStop | null => {
        const flat = byId.get(s.flat);
        // A stop whose flat hasn't arrived in the lookup yet has nothing to edit;
        // it reappears when that query settles.
        if (!flat) return null;
        /*
         * The apartment-type verdict is taken from the flat in hand, not from the
         * round payload. Editing a flat invalidates the flats key but not this
         * query, so trusting the payload would leave the warning up after someone
         * had just fixed it from the round. The rate case stays the server's to
         * answer — rates aren't in any query here.
         */
        const typeMissing = flat.apartment_type == null;
        const serverSaysType = s.blocked_kind === 'apartment_type';
        return {
          flatId: s.flat,
          flatNumber: s.flat_number,
          meterId: s.meter as number,
          previousReading: s.previous_reading,
          bill: s.bill,
          read: s.read,
          blocked: typeMissing ? APARTMENT_TYPE_BLOCKED : serverSaysType ? null : s.blocked,
          blockedKind: typeMissing ? 'apartment_type' : serverSaysType ? null : s.blocked_kind,
          flat,
        };
      })
      .filter((s): s is RoundStop => s !== null)
      // The server orders by flat_number as text, so '10' sorts before '2'.
      // Re-sorted numerically here, which is the order someone walks in.
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true }));
  }, [round.data, flats.map]);

  /*
   * Counted from `stops` rather than taken from the payload's own totals, so the
   * progress line can never disagree with the list under it: a stop with no meter
   * is dropped above, and the server counts it.
   */
  const done = stops.filter((s) => s.read).length;

  return {
    stops,
    total: stops.length,
    done,
    remaining: stops.length - done,
    isPending: round.isPending || flats.isPending,
  };
}

/**
 * Money owed across every bill that isn't paid, in any month.
 *
 * Aggregated by the database. Summing it in the browser meant fetching every bill
 * ever raised to add up one column, on the landing page.
 */
export function useOutstanding() {
  const query = useQuery({
    queryKey: queryKeys.billing.outstanding,
    queryFn: fetchOutstanding,
  });

  return {
    amount: Number(query.data?.amount ?? 0),
    billCount: query.data?.bill_count ?? 0,
    isPending: query.isPending,
  };
}
