/**
 * Composes the Visitor log: server-filtered/paginated visitors joined with the
 * flat number + building name (resolved from reference lookups) and any vehicle
 * registered against the visit. Status is derived — a visitor with an exit_time
 * is "checked out", otherwise "inside".
 */
import { useMemo } from 'react';

import type { Visitor } from '@/types/api';
import type { ListParams } from '@/types/http';

import { vehicleHooks, visitorHooks } from './resources';
import { useBuildingsLookup, useFlatsLookup } from './use-lookups';

export type VisitorStatus = 'inside' | 'checked out';

export interface VisitorRow {
  visitor: Visitor;
  flatNumber: string;
  buildingName: string;
  vehicleReg: string | null;
  status: VisitorStatus;
}

/** Server-filtered/paginated/sorted visitors, joined with flat/building/vehicle. */
export function useVisitorRows(listParams: ListParams) {
  const visitors = visitorHooks.useList(listParams);
  const vehicles = vehicleHooks.useAll();
  const flats = useFlatsLookup();
  const buildings = useBuildingsLookup();

  const rows = useMemo<VisitorRow[]>(() => {
    const vehicleByVisitor = new Map<number, string>();
    for (const v of vehicles.data ?? []) {
      if (v.visitor != null && v.registration_number) vehicleByVisitor.set(v.visitor, v.registration_number);
    }
    const results = visitors.data?.results ?? [];
    return results.map((visitor) => {
      const flat = flats.map.get(visitor.flat);
      return {
        visitor,
        flatNumber: flat?.flat_number ?? '—',
        buildingName: flat ? buildings.map.get(flat.building)?.name ?? '—' : '—',
        vehicleReg: vehicleByVisitor.get(visitor.id) ?? null,
        status: visitor.exit_time ? 'checked out' : 'inside',
      };
    });
  }, [visitors.data, vehicles.data, flats.map, buildings.map]);

  return {
    rows,
    count: visitors.data?.count ?? 0,
    isLoading: visitors.isPending || vehicles.isPending || flats.isPending || buildings.isPending,
    isError: visitors.isError,
  };
}
