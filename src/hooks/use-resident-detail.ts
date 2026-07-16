/**
 * Assembles the Resident profile: the person, their role(s), active flat,
 * vehicles, and a ledger of the active flat's bills/charges (the backend has no
 * per-person ledger, so it is scoped through the flat they occupy).
 */
import { useMemo } from 'react';

import { deriveResidentRole } from '@/lib/resident-role';

import type { ResidentType } from './use-resident-rows';
import {
  electricityBillHooks,
  maintenanceChargeHooks,
  occupantHooks,
  ownerHooks,
  personHooks,
  vehicleHooks,
} from './resources';
import { useFlatsLookup, useOwnersLookup } from './use-lookups';

export function useResidentDetail(personId: number) {
  const person = personHooks.useItem(personId);
  const vehicles = vehicleHooks.useList({ filters: { person: personId } });
  const occupancies = occupantHooks.useList({ filters: { person: personId } });
  const ownerships = ownerHooks.useList({ filters: { person: personId } });
  const flats = useFlatsLookup();
  const owners = useOwnersLookup();

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
    const isOwner = (ownerships.data?.count ?? 0) > 0;
    const types: ResidentType[] = [];
    if (isOwner) types.push('owner');
    if ((occupancies.data?.count ?? 0) > 0) types.push('tenant');

    const role = deriveResidentRole(personId, {
      isOwner,
      occupiedFlatId: flatId ?? null,
      ownerPersonIdOfFlat: (fid) => {
        const ownerId = flats.map.get(fid)?.owner;
        return ownerId != null ? owners.map.get(ownerId)?.person ?? null : null;
      },
    });

    return {
      person: person.data ?? null,
      types,
      role,
      flat: flatId != null ? flats.map.get(flatId) ?? null : null,
      vehicles: vehicles.data?.results ?? [],
      bills: bills.data?.results ?? [],
      charges: charges.data?.results ?? [],
      isLoading: person.isPending,
      isError: person.isError,
    };
  }, [
    person.data, person.isPending, person.isError, personId,
    ownerships.data, occupancies.data, flatId, flats.map, owners.map,
    vehicles.data, bills.data, charges.data,
  ]);
}
