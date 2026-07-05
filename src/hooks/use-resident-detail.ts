/**
 * Assembles the Resident profile: the person, their role(s), active flat,
 * vehicles, and a ledger of the active flat's bills/charges (the backend has no
 * per-person ledger, so it is scoped through the flat they occupy).
 */
import { useMemo } from 'react';

import type { ResidentType } from './use-resident-rows';
import {
  electricityBillHooks,
  maintenanceChargeHooks,
  occupantHooks,
  ownerHooks,
  personHooks,
  vehicleHooks,
} from './resources';
import { useFlatsLookup } from './use-lookups';

export function useResidentDetail(personId: number) {
  const person = personHooks.useItem(personId);
  const vehicles = vehicleHooks.useList({ filters: { person: personId } });
  const occupancies = occupantHooks.useList({ filters: { person: personId } });
  const ownerships = ownerHooks.useList({ filters: { person: personId } });
  const flats = useFlatsLookup();

  const activeOcc = occupancies.data?.results.find((o) => o.status === 'active');
  const flatId = activeOcc?.flat;

  const bills = electricityBillHooks.useList(
    { filters: { flat: flatId }, ordering: '-billing_period_end' },
    { enabled: flatId != null },
  );
  const charges = maintenanceChargeHooks.useList(
    { filters: { flat: flatId }, ordering: '-billing_period' },
    { enabled: flatId != null },
  );

  return useMemo(() => {
    const types: ResidentType[] = [];
    if ((ownerships.data?.count ?? 0) > 0) types.push('owner');
    if ((occupancies.data?.count ?? 0) > 0) types.push('tenant');

    return {
      person: person.data ?? null,
      types,
      flat: flatId != null ? flats.map.get(flatId) ?? null : null,
      vehicles: vehicles.data?.results ?? [],
      bills: bills.data?.results ?? [],
      charges: charges.data?.results ?? [],
      isLoading: person.isPending,
      isError: person.isError,
    };
  }, [
    person.data, person.isPending, person.isError,
    ownerships.data, occupancies.data, flatId, flats.map,
    vehicles.data, bills.data, charges.data,
  ]);
}
