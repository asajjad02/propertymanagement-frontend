/**
 * Electricity bill rows + summary for the billing list. Fetches all bills once
 * (small per account), joins the flat number, and derives status counts and the
 * outstanding total. Status filter and search are applied client-side (the bill
 * viewset exposes neither a search field nor a cycle filter).
 */
import { useMemo } from 'react';

import type { BillStatus, ElectricityBill } from '@/types/api';

import { electricityBillHooks } from './resources';
import { useFlatsLookup } from './use-lookups';

export type BillFilter = 'all' | BillStatus;

export interface BillRow {
  bill: ElectricityBill;
  flatNumber: string;
}

export function useBillRows(filter: BillFilter, search: string) {
  const bills = electricityBillHooks.useAll({ ordering: '-billing_period_end' });
  const flats = useFlatsLookup();

  const allRows = useMemo<BillRow[]>(
    () =>
      (bills.data ?? []).map((bill) => ({
        bill,
        flatNumber: flats.map.get(bill.flat)?.flat_number ?? `#${bill.flat}`,
      })),
    [bills.data, flats.map],
  );

  const stats = useMemo(() => {
    const data = bills.data ?? [];
    const outstanding = data
      .filter((b) => b.status !== 'paid')
      .reduce((sum, b) => sum + (Number(b.total_payable) || 0), 0);
    return {
      total: data.length,
      issued: data.filter((b) => b.status === 'issued').length,
      paid: data.filter((b) => b.status === 'paid').length,
      outstanding,
    };
  }, [bills.data]);

  const rows = useMemo(() => {
    const byStatus = filter === 'all' ? allRows : allRows.filter((r) => r.bill.status === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (r) => r.flatNumber.toLowerCase().includes(q) || String(r.bill.id).includes(q),
    );
  }, [allRows, filter, search]);

  return { rows, stats, isLoading: bills.isPending || flats.isPending };
}
