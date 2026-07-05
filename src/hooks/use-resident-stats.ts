/** Resident summary counts for the list stat cards. */
import { personHooks, vehicleHooks } from './resources';
import { useOccupantsLookup, useOwnersLookup } from './use-lookups';

export function useResidentStats() {
  const people = personHooks.useList({ page: 1 });
  const vehicles = vehicleHooks.useList({ page: 1 });
  const owners = useOwnersLookup();
  const occupants = useOccupantsLookup();

  return {
    total: people.data?.count ?? 0,
    owners: owners.byPerson.size,
    tenants: occupants.byPerson.size,
    vehicles: vehicles.data?.count ?? 0,
    isLoading: people.isPending,
  };
}
