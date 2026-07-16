/**
 * Composes the Flats list: server-filtered/paginated flats joined with owner
 * and active tenant names resolved from the reference lookups.
 */
import { useMemo } from 'react';

import type { Flat } from '@/types/api';
import type { ListParams } from '@/types/http';

import { flatHooks } from './resources';
import {
  useOccupantsLookup,
  useOwnersLookup,
  usePeopleLookup,
} from './use-lookups';

export interface FlatRow {
  flat: Flat;
  ownerName: string | null;
  tenantName: string | null;
}

/** Server-filtered/paginated/sorted flats, joined with owner/tenant names. */
export function useFlatRows(listParams: ListParams) {
  const flats = flatHooks.useList(listParams);
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
        ownerName,
        tenantName,
      };
    });
  }, [flats.data, owners.map, people.map, occupants.activeByFlat]);

  return {
    rows,
    count: flats.data?.count ?? 0,
    isLoading:
      flats.isPending ||
      owners.isPending ||
      people.isPending ||
      occupants.isPending,
    isError: flats.isError,
  };
}
