/**
 * Ready-to-use query/mutation hooks for every resource. Components import the
 * bundle they need, e.g. `import { buildingHooks } from '@/hooks/resources'`
 * then `buildingHooks.useList()`.
 *
 * Custom billing actions (enter reading, mark paid) are exported separately as
 * mutation hooks since they are not plain CRUD.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as api from '@/api/endpoints';
import { queryKeys } from '@/lib/query-keys';
import type { EnterReadingInput } from '@/types/api';

import { createResourceHooks } from './create-resource-hooks';

// Properties
export const buildingHooks = createResourceHooks('buildings', api.buildings);
export const flatHooks = createResourceHooks('flats', api.flats);

// Residents
export const personHooks = createResourceHooks('people', api.people);
export const ownerHooks = createResourceHooks('owners', api.owners);
export const occupantHooks = createResourceHooks('occupants', api.occupants);
export const vehicleHooks = createResourceHooks('vehicles', api.vehicles);

// Operations
export const visitorHooks = createResourceHooks('visitors', api.visitors);

// Billing
export const meterHooks = createResourceHooks('meters', api.meters);
export const meterReadingHooks = createResourceHooks('meter-readings', api.meterReadings);
export const electricityRateHooks = createResourceHooks('electricity-rates', api.electricityRates);
export const maintenanceRateHooks = createResourceHooks('maintenance-rates', api.maintenanceRates);
export const electricityBillHooks = createResourceHooks('electricity-bills', api.electricityBills);
export const maintenanceChargeHooks = createResourceHooks('maintenance-charges', api.maintenanceCharges);
export const paymentHooks = createResourceHooks('payments', api.payments);

// ---------------------------------------------------------------------------
// Custom billing action hooks
// ---------------------------------------------------------------------------

/** Records a meter reading and issues the electricity bill. */
export function useEnterBillReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EnterReadingInput }) =>
      api.enterBillReading(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.resource('electricity-bills').all });
      qc.invalidateQueries({ queryKey: queryKeys.resource('electricity-bills').detail(id) });
      // The reading also mutates the meter's current_reading.
      qc.invalidateQueries({ queryKey: queryKeys.resource('meters').all });
      qc.invalidateQueries({ queryKey: queryKeys.resource('meter-readings').all });
    },
  });
}

export function useMarkElectricityBillPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markElectricityBillPaid(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.resource('electricity-bills').all }),
  });
}

export function useMarkMaintenanceChargePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markMaintenanceChargePaid(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.resource('maintenance-charges').all }),
  });
}
