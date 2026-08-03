'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchBillingRound } from '@/api/endpoints';
import { electricityBillHooks } from '@/hooks/resources';
import { queryKeys } from '@/lib/query-keys';
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
  /** This month's bill, at any status. Null until a draft is created. */
  bill: ElectricityBill | null;
  /** Already read this month — the bill exists and has left draft. */
  read: boolean;
}

/**
 * The month's billing round, fetched from the server (GET /billing/rounds/).
 *
 * The server owns the round now — scope (occupied flats), period, and each
 * flat's bill + read-state — so this is a thin fetch + shape-map onto RoundStop
 * (one request, not the old flats/meters/bills walk). Shared by the meter round
 * and the Overview; the query is invalidated whenever a bill is created/issued.
 */
export function useBillingRound(month: MonthKey) {
  const round = useQuery({
    queryKey: queryKeys.billing.round(month),
    queryFn: () => fetchBillingRound(month),
  });

  const stops = useMemo<RoundStop[]>(
    () =>
      (round.data?.stops ?? []).map((s) => ({
        flatId: s.flat,
        flatNumber: s.flat_number,
        previousReading: s.previous_reading,
        bill: s.bill,
        read: s.read,
      })),
    [round.data],
  );

  return {
    stops,
    total: round.data?.total ?? 0,
    done: round.data?.done ?? 0,
    remaining: round.data?.remaining ?? 0,
    isPending: round.isPending,
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
