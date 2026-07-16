'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { QuickAddOwnerDialog } from '@/components/owners/quick-add-owner-dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { flatHooks } from '@/hooks/resources';
import { useApartmentTypesLookup, useOwnersLookup, usePeopleLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import type { Flat, FlatInput } from '@/types/api';

const OCCUPANCY = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
];

/** Create/edit a flat. Pass `flat` to edit; omit to create. */
export function FlatForm({ flat, onDone }: { flat?: Flat; onDone: () => void }) {
  const toast = useToast();
  const owners = useOwnersLookup();
  const people = usePeopleLookup();
  const apartmentTypes = useApartmentTypesLookup();
  const create = flatHooks.useCreate();
  const update = flatHooks.useUpdate();

  const [owner, setOwner] = useState(flat?.owner ? String(flat.owner) : '');
  const [apartmentType, setApartmentType] = useState(flat?.apartment_type ? String(flat.apartment_type) : '');
  const [flatNumber, setFlatNumber] = useState(flat?.flat_number ?? '');
  const [floor, setFloor] = useState(String(flat?.floor_number ?? 1));
  const [occupancy, setOccupancy] = useState(flat?.occupancy_status ?? 'vacant');
  const [error, setError] = useState<string | null>(null);
  const [addingOwner, setAddingOwner] = useState(false);

  function resetForFlatEntry() {
    // Keep type/occupancy (likely the same for the next unit); clear the
    // per-unit fields so the user can keep entering flats quickly.
    setFlatNumber('');
    setOwner('');
    setError(null);
  }

  const ownerOptions = useMemo(
    () =>
      (owners.data ?? []).map((o) => ({
        value: String(o.id),
        label: people.map.get(o.person)?.full_name ?? `Owner #${o.id}`,
      })),
    [owners.data, people.map],
  );

  const typeOptions = useMemo(
    () =>
      (apartmentTypes.data ?? [])
        .filter((t) => t.status === 'active')
        .map((t) => ({ value: String(t.id), label: t.name })),
    [apartmentTypes.data],
  );

  const pending = create.isPending || update.isPending;

  async function submit(closeAfter: boolean) {
    setError(null);
    const typeName = apartmentType ? apartmentTypes.map.get(Number(apartmentType))?.name : undefined;
    const payload: FlatInput = {
      owner: owner ? Number(owner) : null,
      apartment_type: apartmentType ? Number(apartmentType) : null,
      flat_number: flatNumber,
      floor_number: Number(floor),
      // Keep the legacy flat_type label in sync with the chosen type.
      flat_type: typeName ?? flat?.flat_type ?? 'standard',
      occupancy_status: occupancy as FlatInput['occupancy_status'],
    };
    try {
      if (flat) await update.mutateAsync({ id: flat.id, payload });
      else await create.mutateAsync(payload);
      toast.success(flat ? 'Flat updated' : 'Flat added', `${flatNumber} saved.`);
      if (closeAfter) onDone();
      else resetForFlatEntry();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Flat number" required>
          {(id) => <Input id={id} value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required />}
        </Field>
        <Field label="Floor">
          {(id) => <Input id={id} type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Apartment type" hint={typeOptions.length === 0 ? 'Add types in Configuration' : undefined}>
          {(id) => (
            <Select
              id={id}
              value={apartmentType || undefined}
              onValueChange={setApartmentType}
              options={typeOptions}
              placeholder="Select type"
              className="w-full"
            />
          )}
        </Field>
        <Field label="Occupancy">
          {(id) => (
            <Select id={id} value={occupancy} onValueChange={(v) => setOccupancy(v as typeof occupancy)}
              options={OCCUPANCY} className="w-full" />
          )}
        </Field>
      </div>
      <Field label="Owner" hint="Optional">
        {(id) => (
          <div className="flex items-center gap-2">
            <Select id={id} value={owner || undefined} onValueChange={setOwner}
              options={ownerOptions} placeholder="No owner" className="w-full flex-1" />
            <Button type="button" variant="secondary" onClick={() => setAddingOwner(true)}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        )}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        {!flat && (
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !flatNumber}
            onClick={() => void submit(false)}
          >
            Save &amp; add another
          </Button>
        )}
        <Button type="submit" disabled={pending || !flatNumber}>
          {flat ? 'Save changes' : 'Add flat'}
        </Button>
      </div>

      <QuickAddOwnerDialog
        open={addingOwner}
        onOpenChange={setAddingOwner}
        onCreated={(ownerId) => setOwner(String(ownerId))}
      />
    </form>
  );
}
