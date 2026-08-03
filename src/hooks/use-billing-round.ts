'use client';

import { useMemo } from 'react';

import { electricityBillHooks, meterHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import type { ElectricityBill, Meter } from '@/types/api';

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
      .map((f) => {
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
          bill,
          read: !!bill && bill.status !== 'draft',
        } satisfies RoundStop;
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
