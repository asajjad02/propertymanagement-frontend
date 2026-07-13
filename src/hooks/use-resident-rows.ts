/**
 * Composes the Residents list: server-filtered/paginated people joined with
 * their role (owner / tenant), active flat, and contact. Role and flat come
 * from the owner/occupant lookups since `Person` itself carries no membership
 * info; the `type`/`building` filtering is done server-side.
 */
import { useMemo } from 'react';

import type { Person } from '@/types/api';
import type { ListParams } from '@/types/http';
import { deriveResidentRole, type ResidentRole } from '@/lib/resident-role';

import { personHooks } from './resources';
import {
  useFlatsLookup,
  useOccupantsLookup,
  useOwnersLookup,
} from './use-lookups';

export type ResidentType = 'owner' | 'tenant';

export interface ResidentRow {
  person: Person;
  types: ResidentType[];
  role: ResidentRole | null;
  flatNumber: string | null;
}

/** Server-filtered/paginated/sorted people, joined with role + active flat. */
export function useResidentRows(listParams: ListParams) {
  const people = personHooks.useList(listParams);
  const owners = useOwnersLookup();
  const occupants = useOccupantsLookup();
  const flats = useFlatsLookup();

  const rows = useMemo<ResidentRow[]>(() => {
    const results = people.data?.results ?? [];
    const activeOccByPerson = new Map(
      (occupants.data ?? [])
        .filter((o) => o.status === 'active')
        .map((o) => [o.person, o]),
    );
    const ownerPersonIdOfFlat = (flatId: number): number | null => {
      const ownerId = flats.map.get(flatId)?.owner;
      return ownerId != null ? owners.map.get(ownerId)?.person ?? null : null;
    };
    return results.map((person) => {
      const types: ResidentType[] = [];
      if (owners.byPerson.has(person.id)) types.push('owner');
      if (occupants.byPerson.has(person.id)) types.push('tenant');
      const occ = activeOccByPerson.get(person.id);
      const flatNumber = occ ? flats.map.get(occ.flat)?.flat_number ?? null : null;
      const role = deriveResidentRole(person.id, {
        isOwner: owners.byPerson.has(person.id),
        occupiedFlatId: occ?.flat ?? null,
        ownerPersonIdOfFlat,
      });
      return { person, types, role, flatNumber };
    });
  }, [people.data, owners.byPerson, owners.map, occupants.data, occupants.byPerson, flats.map]);

  return {
    rows,
    count: people.data?.count ?? 0,
    isLoading: people.isPending || owners.isPending || occupants.isPending || flats.isPending,
    isError: people.isError,
  };
}
