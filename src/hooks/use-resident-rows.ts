/**
 * Composes the Residents list: people joined with their role (owner / tenant),
 * active flat, and contact. Role and flat come from the owner/occupant lookups
 * since `Person` itself carries no membership info.
 */
import { useMemo } from 'react';

import type { Person } from '@/types/api';

import { personHooks } from './resources';
import {
  useFlatsLookup,
  useOccupantsLookup,
  useOwnersLookup,
} from './use-lookups';

export type ResidentType = 'owner' | 'tenant';
export type ResidentFilter = 'everyone' | 'owners' | 'tenants';

export interface ResidentRow {
  person: Person;
  types: ResidentType[];
  flatNumber: string | null;
}

export function useResidentRows(filter: ResidentFilter, search: string, page?: number) {
  const people = personHooks.useList({
    page,
    search: search || undefined,
    ordering: 'full_name',
  });
  const owners = useOwnersLookup();
  const occupants = useOccupantsLookup();
  const flats = useFlatsLookup();

  const allRows = useMemo<ResidentRow[]>(() => {
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

  const rows = useMemo(() => {
    if (filter === 'owners') return allRows.filter((r) => r.types.includes('owner'));
    if (filter === 'tenants') return allRows.filter((r) => r.types.includes('tenant'));
    return allRows;
  }, [allRows, filter]);

  return {
    rows,
    count: people.data?.count ?? 0,
    isLoading: people.isPending || owners.isPending || occupants.isPending || flats.isPending,
    isError: people.isError,
  };
}
