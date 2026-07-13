/**
 * Composes the Flats list: server-filtered/paginated flats joined with owner,
 * active tenant, and building names resolved from the reference lookups.
 */
import { useMemo } from 'react';

import type { Flat } from '@/types/api';
import type { ListParams } from '@/types/http';

import { flatHooks } from './resources';
import {
  useBuildingsLookup,
  useOccupantsLookup,
  useOwnersLookup,
  usePeopleLookup,
} from './use-lookups';

export interface FlatRow {
  flat: Flat;
  buildingName: string;
  ownerName: string | null;
  tenantName: string | null;
}

/** Server-filtered/paginated/sorted flats, joined with owner/tenant/building names. */
export function useFlatRows(listParams: ListParams) {
  const flats = flatHooks.useList(listParams);
  const buildings = useBuildingsLookup();
  const owners = useOwnersLookup();
  const people = usePeopleLookup();
  const occupants = useOccupantsLookup();

  const rows = useMemo<FlatRow[]>(() => {
    const results = flats.data?.results ?? [];
    return results.map((flat) => {
      const owner = flat.owner != null ? owners.map.get(flat.owner) : undefined;
      const ownerName = owner ? people.map.get(owner.person)?.full_name ?? null : null;
      const tenant = occupants.activeByFlat.get(flat.id);
      const tenantName = tenant ? people.map.get(tenant.person)?.full_name ?? null : null;
      return {
        flat,
        buildingName: buildings.map.get(flat.building)?.name ?? '—',
        ownerName,
        tenantName,
      };
    });
  }, [flats.data, buildings.map, owners.map, people.map, occupants.activeByFlat]);

  return {
    rows,
    count: flats.data?.count ?? 0,
    isLoading:
      flats.isPending ||
      buildings.isPending ||
      owners.isPending ||
      people.isPending ||
      occupants.isPending,
    isError: flats.isError,
  };
}
