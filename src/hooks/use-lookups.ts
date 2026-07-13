/**
 * Reference-data lookups. Because the DRF serializers return foreign keys as
 * ids (not nested objects), joins happen client-side. These hooks fetch the
 * small account-scoped reference sets once and expose id→entity maps so feature
 * hooks/components can resolve names without repeating the fetch-and-index dance.
 */
import { useMemo } from 'react';

import type { ApartmentType, Building, Flat, Occupant, Owner, Person, StaffMember } from '@/types/api';

import {
  apartmentTypeHooks,
  buildingHooks,
  flatHooks,
  occupantHooks,
  ownerHooks,
  personHooks,
  staffMemberHooks,
} from './resources';

function byId<T extends { id: number }>(rows: T[] | undefined): Map<number, T> {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export function usePeopleLookup() {
  const query = personHooks.useAll();
  const map = useMemo<Map<number, Person>>(() => byId(query.data), [query.data]);
  return { ...query, map };
}

export function useBuildingsLookup() {
  const query = buildingHooks.useAll();
  const map = useMemo<Map<number, Building>>(() => byId(query.data), [query.data]);
  return { ...query, map };
}

export function useFlatsLookup() {
  const query = flatHooks.useAll();
  const map = useMemo<Map<number, Flat>>(() => byId(query.data), [query.data]);
  return { ...query, map };
}

export function useApartmentTypesLookup() {
  const query = apartmentTypeHooks.useAll();
  const map = useMemo<Map<number, ApartmentType>>(() => byId(query.data), [query.data]);
  return { ...query, map };
}

export function useStaffLookup() {
  const query = staffMemberHooks.useAll();
  const map = useMemo<Map<number, StaffMember>>(() => byId(query.data), [query.data]);
  return { ...query, map };
}

export function useOwnersLookup() {
  const query = ownerHooks.useAll();
  const map = useMemo<Map<number, Owner>>(() => byId(query.data), [query.data]);
  // Also index by the person they point to, for resident-type resolution.
  const byPerson = useMemo(
    () => new Set((query.data ?? []).map((o) => o.person)),
    [query.data],
  );
  return { ...query, map, byPerson };
}

export function useOccupantsLookup() {
  const query = occupantHooks.useAll();
  // Active occupant per flat, and the set of person ids that are tenants.
  const activeByFlat = useMemo<Map<number, Occupant>>(() => {
    const m = new Map<number, Occupant>();
    for (const occ of query.data ?? []) {
      if (occ.status === 'active') m.set(occ.flat, occ);
    }
    return m;
  }, [query.data]);
  const byPerson = useMemo(() => new Set((query.data ?? []).map((o) => o.person)), [query.data]);
  return { ...query, activeByFlat, byPerson };
}
