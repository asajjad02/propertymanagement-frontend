'use client';

import { useMemo } from 'react';

import { electricityBillHooks, meterHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import type { ElectricityBill, Flat, Meter } from '@/types/api';

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
  meterId: number;
  /** What a new reading will be measured against. */
  previousReading: string;
  /** This month's bill, at any status. Null until the round creates one. */
  bill: ElectricityBill | null;
  /**
   * Already read for this month — the bill exists and has left draft.
   *
   * Derived from the server, never from what happened during a session: a flat
   * billed on an earlier visit must not come back as pending, or the round
   * would happily issue a second bill for the same month.
   */
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
 * Vacant flats are in it too. Maintenance is owed on a flat whether or not
 * anyone lives in it, and skipping a vacant flat also skipped its meter reading,
 * so the next occupant inherited a baseline nobody had checked.
 *
 * Shared by the meter round and the Overview so the two always report the same
 * progress. All three queries are cached, so a second caller costs nothing.
 */
export function useBillingRound(month: MonthKey) {
  const flats = useFlatsLookup();
  const meters = meterHooks.useAll();
  const bills = electricityBillHooks.useAll();

  const stops = useMemo<RoundStop[]>(() => {
    const meterByFlat = new Map<number, Meter>();
    for (const m of meters.data ?? []) if (!meterByFlat.has(m.flat)) meterByFlat.set(m.flat, m);

    const billByFlat = new Map<number, ElectricityBill>();
    for (const b of bills.data ?? []) {
      if (monthKeyOf(b.billing_period_end) !== month) continue;
      // Prefer a non-draft bill if somehow both exist for a flat this month.
      const existing = billByFlat.get(b.flat);
      if (!existing || (existing.status === 'draft' && b.status !== 'draft')) billByFlat.set(b.flat, b);
    }

    return (flats.data ?? [])
      // Annotated return rather than `satisfies` on the literal: TS narrows a
      // const to its assigned value at the use site, so the object's inferred
      // blockedKind was narrower than RoundStop's and failed the guard below.
      // The annotation checks the literal just as strictly.
      .map((f): RoundStop | null => {
        const meter = meterByFlat.get(f.id);
        if (!meter) return null;
        const bill = billByFlat.get(f.id) ?? null;
        return {
          flatId: f.id,
          flatNumber: f.flat_number,
          meterId: meter.id,
          // An existing bill carries its own baseline; otherwise the meter's
          // running value is the baseline the backend has been maintaining.
          previousReading: bill ? bill.previous_reading : meter.current_reading,
          // Mirrors the server's own test (billing/rounds.py `_blocked`). Rates
          // aren't in this hook's queries, so only the flat-level cause is
          // checked here; the server still refuses the other case.
          blocked:
            f.apartment_type == null
              ? 'This flat has no apartment type, so its maintenance charge is unknown.'
              : null,
          blockedKind: f.apartment_type == null ? 'apartment_type' : null,
          flat: f,
          bill,
          read: !!bill && bill.status !== 'draft',
        };
      })
      .filter((s): s is RoundStop => s !== null)
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true }));
  }, [flats.data, meters.data, bills.data, month]);

  const done = stops.filter((s) => s.read).length;

  return {
    stops,
    total: stops.length,
    done,
    remaining: stops.length - done,
    isPending: flats.isPending || meters.isPending || bills.isPending,
  };
}

/**
 * Money owed across every bill that isn't paid, in any month.
 *
 * Mirrors the backend's `outstanding_for_flat`, which also excludes only paid
 * bills. Drafts contribute nothing — their totals are zero until issued.
 */
export function useOutstanding() {
  const bills = electricityBillHooks.useAll();

  return useMemo(() => {
    const unpaid = (bills.data ?? []).filter((b) => b.status !== 'paid' && Number(b.total_payable) > 0);
    return {
      amount: unpaid.reduce((sum, b) => sum + Number(b.total_payable || 0), 0),
      billCount: unpaid.length,
      isPending: bills.isPending,
    };
  }, [bills.data, bills.isPending]);
}
