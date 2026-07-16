/**
 * Composes the Owners list: server-filtered/paginated owners joined with their
 * person (name/contact) and the flats they own (resolved from the flats lookup,
 * since `Flat.owner` points back at the owner record).
 */
import { useMemo } from 'react';

import type { Owner } from '@/types/api';
import type { ListParams } from '@/types/http';

import { ownerHooks } from './resources';
import { useFlatsLookup, usePeopleLookup } from './use-lookups';

export interface OwnerRow {
  owner: Owner;
  personId: number | null;
  name: string;
  phone: string;
  cnic: string;
  ownedFlats: string[];
}

/** Server-filtered/paginated/sorted owners, joined with person + owned flats. */
export function useOwnerRows(listParams: ListParams) {
  const owners = ownerHooks.useList(listParams);
  const people = usePeopleLookup();
  const flats = useFlatsLookup();

  const rows = useMemo<OwnerRow[]>(() => {
    const flatsByOwner = new Map<number, string[]>();
    for (const f of flats.map.values()) {
      if (f.owner != null) {
        const arr = flatsByOwner.get(f.owner) ?? [];
        arr.push(f.flat_number);
        flatsByOwner.set(f.owner, arr);
      }
    }
    return (owners.data?.results ?? []).map((owner) => {
      const person = people.map.get(owner.person) ?? null;
      const ownedFlats = (flatsByOwner.get(owner.id) ?? []).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
      return {
        owner,
        personId: person?.id ?? null,
        name: person?.full_name ?? `Owner #${owner.id}`,
        phone: person?.phone ?? '',
        cnic: person?.cnic ?? '',
        ownedFlats,
      };
    });
  }, [owners.data, people.map, flats.map]);

  return {
    rows,
    count: owners.data?.count ?? 0,
    isLoading: owners.isPending || people.isPending || flats.isPending,
    isError: owners.isError,
  };
}
