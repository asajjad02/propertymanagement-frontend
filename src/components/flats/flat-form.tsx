'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { flatHooks } from '@/hooks/resources';
import { useBuildingsLookup, useOwnersLookup, usePeopleLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import type { Flat, FlatInput } from '@/types/api';

const OCCUPANCY = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
];

/** Create/edit a flat. Pass `flat` to edit; omit to create. */
export function FlatForm({ flat, onDone }: { flat?: Flat; onDone: () => void }) {
  const buildings = useBuildingsLookup();
  const owners = useOwnersLookup();
  const people = usePeopleLookup();
  const create = flatHooks.useCreate();
  const update = flatHooks.useUpdate();

  const [building, setBuilding] = useState(flat ? String(flat.building) : '');
  const [owner, setOwner] = useState(flat?.owner ? String(flat.owner) : '');
  const [flatNumber, setFlatNumber] = useState(flat?.flat_number ?? '');
  const [floor, setFloor] = useState(String(flat?.floor_number ?? 1));
  const [flatType, setFlatType] = useState(flat?.flat_type ?? 'standard');
  const [occupancy, setOccupancy] = useState(flat?.occupancy_status ?? 'vacant');
  const [error, setError] = useState<string | null>(null);

  const buildingOptions = useMemo(
    () => (buildings.data ?? []).map((b) => ({ value: String(b.id), label: b.name })),
    [buildings.data],
  );
  const ownerOptions = useMemo(
    () =>
      (owners.data ?? []).map((o) => ({
        value: String(o.id),
        label: people.map.get(o.person)?.full_name ?? `Owner #${o.id}`,
      })),
    [owners.data, people.map],
  );

  const pending = create.isPending || update.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: FlatInput = {
      building: Number(building),
      owner: owner ? Number(owner) : null,
      flat_number: flatNumber,
      floor_number: Number(floor),
      flat_type: flatType,
      occupancy_status: occupancy as FlatInput['occupancy_status'],
    };
    try {
      if (flat) await update.mutateAsync({ id: flat.id, payload });
      else await create.mutateAsync(payload);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Building" required>
        {(id) => (
          <Select id={id} value={building || undefined} onValueChange={setBuilding}
            options={buildingOptions} placeholder="Select building" className="w-full" />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Flat number" required>
          {(id) => <Input id={id} value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} required />}
        </Field>
        <Field label="Floor">
          {(id) => <Input id={id} type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          {(id) => <Input id={id} value={flatType} onChange={(e) => setFlatType(e.target.value)} />}
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
          <Select id={id} value={owner || undefined} onValueChange={setOwner}
            options={ownerOptions} placeholder="No owner" className="w-full" />
        )}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending || !building || !flatNumber}>
          {flat ? 'Save changes' : 'Add flat'}
        </Button>
      </div>
    </form>
  );
}
