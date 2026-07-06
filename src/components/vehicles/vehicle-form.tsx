'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { vehicleHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { Vehicle, VehicleInput } from '@/types/api';

const TYPES = ['car', 'motorcycle', 'bicycle', 'van', 'suv', 'other'];

/** Create/edit a vehicle for a person. Pass `vehicle` to edit. */
export function VehicleForm({
  personId,
  vehicle,
  onDone,
}: {
  personId: number;
  vehicle?: Vehicle;
  onDone: () => void;
}) {
  const create = vehicleHooks.useCreate();
  const update = vehicleHooks.useUpdate();
  const [type, setType] = useState(vehicle?.vehicle_type ?? 'car');
  const [registration, setRegistration] = useState(vehicle?.registration_number ?? '');
  const [color, setColor] = useState(vehicle?.color ?? '');
  const [slot, setSlot] = useState(vehicle?.parking_slot_number ?? '');
  const [error, setError] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: VehicleInput = {
      person: personId,
      visitor: null,
      vehicle_type: type,
      registration_number: registration,
      color,
      parking_slot_number: slot,
    };
    try {
      if (vehicle) await update.mutateAsync({ id: vehicle.id, payload });
      else await create.mutateAsync(payload);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          {(id) => (
            <Select id={id} value={type} onValueChange={setType} className="w-full"
              options={TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} />
          )}
        </Field>
        <Field label="Registration #">
          {(id) => <Input id={id} value={registration} onChange={(e) => setRegistration(e.target.value)} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Color">{(id) => <Input id={id} value={color} onChange={(e) => setColor(e.target.value)} />}</Field>
        <Field label="Parking slot">{(id) => <Input id={id} value={slot} onChange={(e) => setSlot(e.target.value)} />}</Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending}>{vehicle ? 'Save changes' : 'Add vehicle'}</Button>
      </div>
    </form>
  );
}
