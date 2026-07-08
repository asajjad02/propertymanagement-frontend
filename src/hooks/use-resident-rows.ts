/**
 * Composes the Residents list: server-filtered/paginated people joined with
 * their role (owner / tenant), active flat, and contact. Role and flat come
 * from the owner/occupant lookups since `Person` itself carries no membership
 * info; the `type`/`building` filtering is done server-side.
 */
import { useMemo } from 'react';

import type { Person } from '@/types/api';
import type { ListParams } from '@/types/http';

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
    return results.map((person) => {
      const types: ResidentType[] = [];
      if (owners.byPerson.has(person.id)) types.push('owner');
      if (occupants.byPerson.has(person.id)) types.push('tenant');
      const occ = activeOccByPerson.get(person.id);
      const flatNumber = occ ? flats.map.get(occ.flat)?.flat_number ?? null : null;
      return { person, types, flatNumber };
    });
  }, [people.data, owners.byPerson, occupants.data, occupants.byPerson, flats.map]);

  return {
    rows,
    count: people.data?.count ?? 0,
    isLoading: people.isPending || owners.isPending || occupants.isPending || flats.isPending,
    isError: people.isError,
  };
}
