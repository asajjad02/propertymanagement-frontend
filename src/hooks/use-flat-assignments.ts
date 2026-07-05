/**
 * Mutations for wiring people to a flat. The backend has no dedicated "assign"
 * endpoints, so these compose the generic owners/occupants/flats resources:
 *
 * - assignOwner: find-or-create an Owner for the person, then set flat.owner.
 * - assignResident: create an active tenant Occupant + mark the flat occupied.
 * - endTenancy: deactivate an occupant; if none remain active, mark it vacant.
 *
 * "Owner is the default resident" is a display rule (see use-flat-detail); it is
 * not persisted here.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { flats as flatsApi, occupants as occupantsApi, owners as ownersApi } from '@/api/endpoints';

const today = () => format(new Date(), 'yyyy-MM-dd');

function useInvalidate() {
  const qc = useQueryClient();
  return (...resources: string[]) =>
    Promise.all(resources.map((r) => qc.invalidateQueries({ queryKey: [r] })));
}

/** Set (or change) a flat's owner, creating the Owner record if the person has none. */
export function useAssignOwner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ flatId, personId }: { flatId: number; personId: number }) => {
      const existing = await ownersApi.list({ filters: { person: personId } });
      const owner =
        existing.results[0] ??
        (await ownersApi.create({ person: personId, owner_type: 'primary', status: 'active' }));
      return flatsApi.patch(flatId, { owner: owner.id });
    },
    onSuccess: () => invalidate('flats', 'owners'),
  });
}

/** Remove a flat's owner link (does not delete the Owner record). */
export function useRemoveOwner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (flatId: number) => flatsApi.patch(flatId, { owner: null }),
    onSuccess: () => invalidate('flats'),
  });
}

/** Assign an active tenant to a flat and mark the flat occupied. */
export function useAssignResident() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      flatId,
      personId,
      moveInDate,
    }: {
      flatId: number;
      personId: number;
      moveInDate?: string;
    }) => {
      await occupantsApi.create({
        person: personId,
        flat: flatId,
        occupancy_type: 'tenant',
        move_in_date: moveInDate || today(),
        move_out_date: null,
        status: 'active',
      });
      return flatsApi.patch(flatId, { occupancy_status: 'occupied' });
    },
    onSuccess: () => invalidate('flats', 'occupants'),
  });
}

/** End a tenancy; if no active occupants remain, mark the flat vacant. */
export function useEndTenancy() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ occupantId, flatId }: { occupantId: number; flatId: number }) => {
      await occupantsApi.patch(occupantId, { status: 'inactive', move_out_date: today() });
      const remaining = await occupantsApi.list({ filters: { flat: flatId, status: 'active' } });
      if (remaining.count === 0) await flatsApi.patch(flatId, { occupancy_status: 'vacant' });
    },
    onSuccess: () => invalidate('flats', 'occupants'),
  });
}
