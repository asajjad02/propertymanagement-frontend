/** Assembles the electricity bill detail: bill, flat/meter, payments. */
import { useMemo } from 'react';

import { electricityBillHooks, paymentHooks } from './resources';
import { useFlatsLookup } from './use-lookups';
import { meterHooks } from './resources';

export function useBillDetail(billId: number) {
  const bill = electricityBillHooks.useItem(billId);
  const flats = useFlatsLookup();
  const meter = meterHooks.useItem(bill.data?.meter, { enabled: bill.data?.meter != null });
  const payments = paymentHooks.useList({ filters: { electricity_bill: billId }, ordering: '-payment_date' });

  return useMemo(() => {
    const billData = bill.data ?? null;
    const flat = billData ? flats.map.get(billData.flat) ?? null : null;
    return {
      bill: billData,
      flat,
      meterNumber: meter.data?.meter_number ?? null,
      payments: payments.data?.results ?? [],
      isLoading: bill.isPending,
      isError: bill.isError,
    };
  }, [bill.data, bill.isPending, bill.isError, flats.map, meter.data, payments.data]);
}
