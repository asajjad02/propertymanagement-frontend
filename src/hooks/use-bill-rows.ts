/**
 * Electricity bill rows for the billing list. Server-filtered/paginated/sorted
 * bills joined client-side with their flat number resolved from the reference
 * lookups. `listParams` comes straight from `useTableQuery`.
 */
import { useMemo } from 'react';

import type { ElectricityBill } from '@/types/api';
import type { ListParams } from '@/types/http';

import { electricityBillHooks } from './resources';
import { useFlatsLookup } from './use-lookups';

export interface BillRow {
  bill: ElectricityBill;
  flatNumber: string;
}

/** Server-filtered/paginated/sorted bills, joined with flat number. */
export function useBillRows(listParams: ListParams) {
  const bills = electricityBillHooks.useList(listParams);
  const flats = useFlatsLookup();

  const rows = useMemo<BillRow[]>(() => {
    const results = bills.data?.results ?? [];
    return results.map((bill) => {
      const flat = flats.map.get(bill.flat);
      return {
        bill,
        flatNumber: flat?.flat_number ?? `#${bill.flat}`,
      };
    });
  }, [bills.data, flats.map]);

  return {
    rows,
    count: bills.data?.count ?? 0,
    isLoading: bills.isPending || flats.isPending,
  };
}
