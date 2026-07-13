/**
 * Assembles everything the Flat detail page needs: the flat, its building,
 * owner + active tenant (people resolved via lookups), vehicles belonging to
 * those people, the flat's bills/charges, and the outstanding-dues total.
 */
import { useMemo } from 'react';

import type { Person } from '@/types/api';

import {
  electricityBillHooks,
  flatHooks,
  maintenanceChargeHooks,
  vehicleHooks,
} from './resources';
import {
  useBuildingsLookup,
  useOccupantsLookup,
  useOwnersLookup,
  usePeopleLookup,
} from './use-lookups';

function sum(values: string[]): number {
  return values.reduce((total, v) => total + (Number(v) || 0), 0);
}

export function useFlatDetail(flatId: number) {
  const flat = flatHooks.useItem(flatId);
  const buildings = useBuildingsLookup();
  const owners = useOwnersLookup();
  const people = usePeopleLookup();
  const occupants = useOccupantsLookup();
  const vehicles = vehicleHooks.useAll();
  const bills = electricityBillHooks.useList({ filters: { flat: flatId }, ordering: '-billing_period_end' });
  const charges = maintenanceChargeHooks.useList({ filters: { flat: flatId }, ordering: '-billing_period' });

  return useMemo(() => {
    const flatData = flat.data ?? null;
    const building = flatData ? buildings.map.get(flatData.building) ?? null : null;

    const ownerRec = flatData?.owner != null ? owners.map.get(flatData.owner) : undefined;
    const owner: Person | null = ownerRec ? people.map.get(ownerRec.person) ?? null : null;

    const tenantOcc = occupants.activeByFlat.get(flatId);
    const tenant: Person | null = tenantOcc ? people.map.get(tenantOcc.person) ?? null : null;

    const personIds = new Set([owner?.id, tenant?.id].filter((v): v is number => v != null));
    const flatVehicles = (vehicles.data ?? []).filter((v) => v.person != null && personIds.has(v.person));

    const billRows = bills.data?.results ?? [];
    const chargeRows = charges.data?.results ?? [];
    const outstanding =
      sum(billRows.filter((b) => b.status !== 'paid').map((b) => b.total_payable)) +
      sum(chargeRows.filter((c) => c.status !== 'paid').map((c) => c.total_due));

    // Display rule: the resident is the active tenant, or the owner by default
    // (owner-occupied) when there is no tenant. Neither → vacant.
    const resident = tenant ?? owner;
    const residentIsOwner = !tenant && !!owner;

    return {
      flat: flatData,
      building,
      owner,
      tenant,
      resident,
      residentIsOwner,
      activeOccupantId: tenantOcc?.id ?? null,
      vehicles: flatVehicles,
      bills: billRows,
      charges: chargeRows,
      outstanding,
      isLoading: flat.isPending,
      isError: flat.isError,
      // The bills/charges/account-summary sections have their own queries; track
      // them separately so they show a loading state instead of a premature
      // "No bills yet" before those requests resolve.
      billsLoading: bills.isPending || charges.isPending,
    };
  }, [
    flat.data, flat.isPending, flat.isError, flatId,
    buildings.map, owners.map, people.map, occupants.activeByFlat,
    vehicles.data, bills.data, bills.isPending, charges.data, charges.isPending,
  ]);
}
