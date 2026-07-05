/** Assembles the electricity bill detail: bill, flat/building/meter, payments. */
import { useMemo } from 'react';

import { electricityBillHooks, paymentHooks } from './resources';
import { useBuildingsLookup, useFlatsLookup } from './use-lookups';
import { meterHooks } from './resources';

export function useBillDetail(billId: number) {
  const bill = electricityBillHooks.useItem(billId);
  const flats = useFlatsLookup();
  const buildings = useBuildingsLookup();
  const meter = meterHooks.useItem(bill.data?.meter, { enabled: bill.data?.meter != null });
  const payments = paymentHooks.useList({ filters: { electricity_bill: billId }, ordering: '-payment_date' });

  return useMemo(() => {
    const billData = bill.data ?? null;
    const flat = billData ? flats.map.get(billData.flat) ?? null : null;
    const building = flat ? buildings.map.get(flat.building) ?? null : null;
    return {
      bill: billData,
      flat,
      building,
      meterNumber: meter.data?.meter_number ?? null,
      payments: payments.data?.results ?? [],
      isLoading: bill.isPending,
      isError: bill.isError,
    };
  }, [bill.data, bill.isPending, bill.isError, flats.map, buildings.map, meter.data, payments.data]);
}
