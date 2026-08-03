'use client';

import { useMemo } from 'react';

import { electricityBillHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import type { ElectricityBill } from '@/types/api';

/** `YYYY-MM` — the month a billing round covers. */
export type MonthKey = string;

export function monthKeyOf(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** One stop on the round: an occupied flat, and its bill for the chosen month. */
export interface RoundStop {
  flatId: number;
  flatNumber: string;
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
 * A billing round: one month × every occupied flat.
 *
 * Every flat has exactly one meter, so the running reading comes off the flat
 * (`current_reading`) — no need to load meters. Shared by the meter round and
 * the Overview so the two always report the same progress; both queries are
 * cached, so a second caller costs nothing.
 */
export function useBillingRound(month: MonthKey) {
  const flats = useFlatsLookup();
  const bills = electricityBillHooks.useAll();

  const stops = useMemo<RoundStop[]>(() => {
    const billByFlat = new Map<number, ElectricityBill>();
    for (const b of bills.data ?? []) {
      if (monthKeyOf(b.billing_period_end) !== month) continue;
      // Prefer a non-draft bill if somehow both exist for a flat this month.
      const existing = billByFlat.get(b.flat);
      if (!existing || (existing.status === 'draft' && b.status !== 'draft')) billByFlat.set(b.flat, b);
    }

    return (flats.data ?? [])
      .filter((f) => f.occupancy_status === 'occupied')
      .map((f) => {
        const bill = billByFlat.get(f.id) ?? null;
        return {
          flatId: f.id,
          flatNumber: f.flat_number,
          // An existing bill carries its own baseline; otherwise the flat's
          // running reading is the baseline the backend has been maintaining.
          previousReading: bill ? bill.previous_reading : (f.current_reading ?? '0'),
          bill,
          read: !!bill && bill.status !== 'draft',
        } satisfies RoundStop;
      })
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true }));
  }, [flats.data, bills.data, month]);

  const done = stops.filter((s) => s.read).length;

  return {
    stops,
    total: stops.length,
    done,
    remaining: stops.length - done,
    isPending: flats.isPending || bills.isPending,
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
