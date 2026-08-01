'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { vehicleHooks, visitorHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import { queryKeys } from '@/lib/query-keys';

const VEHICLE_TYPES = [
  { value: 'Car', label: 'Car' },
  { value: 'Motorcycle', label: 'Motorcycle' },
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Rickshaw', label: 'Rickshaw' },
];

/**
 * Gate-optimised: bigger tap targets and roomier spacing so Rashid can log a
 * visitor one-handed at the gate. Only visitor name + flat are required; the
 * flat is a type-to-filter picker; entry time is stamped server-side.
 */
const GATE_CONTROL = 'h-12 text-base';

/** Log a new visitor. Entry time is stamped to now; exit is recorded on checkout. */
export function VisitorForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const flats = useFlatsLookup();
  const create = visitorHooks.useCreate();
  const createVehicle = vehicleHooks.useCreate();
  const [flat, setFlat] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [cnic, setCnic] = useState('');
  const [host, setHost] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [registration, setRegistration] = useState('');
  const [error, setError] = useState<string | null>(null);

  const flatOptions = useMemo(
    () => (flats.data ?? []).map((f) => ({ value: String(f.id), label: f.flat_number })),
    [flats.data],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const visitor = await create.mutateAsync({
        flat: Number(flat),
        visitor_name: name,
        contact_number: contact,
        cnic,
        host_name: host,
        entry_time: new Date().toISOString(),
        exit_time: null,
      });
      // Inline vehicle capture: a registration creates a Vehicle linked to the
      // visit. If it fails, the visit is already logged — don't hold the gate.
      const reg = registration.trim();
      if (reg) {
        try {
          await createVehicle.mutateAsync({
            person: null,
            visitor: visitor.id,
            vehicle_type: vehicleType,
            registration_number: reg,
            color: '',
            parking_slot_number: '',
          });
          // The table joins vehicles via `useAll` (['vehicles'] namespace),
          // which the default create invalidation ('list') doesn't cover.
          qc.invalidateQueries({ queryKey: queryKeys.resource('vehicles').all });
        } catch (vehErr) {
          toast.warning('Visitor logged, vehicle not saved', toApiError(vehErr).message);
          onDone();
          return;
        }
      }
      toast.success('Visitor logged', name);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  const submitting = create.isPending || createVehicle.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Required, and kept first + large for gate speed. */}
      <Field label="Flat visited" required>
        {(id) => (
          <SearchableSelect
            id={id}
            value={flat || undefined}
            onValueChange={setFlat}
            options={flatOptions}
            placeholder="Select flat"
            searchPlaceholder="Type a flat number…"
            className={`w-full ${GATE_CONTROL}`}
          />
        )}
      </Field>
      <Field label="Visitor name" required>
        {(id) => (
          <Input autoCapitalize="words"
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={GATE_CONTROL}
          />
        )}
      </Field>

      {/* Optional details — never required, so they never slow the gate. */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact number">
          {(id) => (
            <Input type="tel" autoComplete="off"
              id={id}
              value={contact}
              inputMode="tel"
              onChange={(e) => setContact(e.target.value)}
              className={GATE_CONTROL}
            />
          )}
        </Field>
        <Field label="CNIC">
          {(id) => (
            <Input inputMode="numeric" id={id} value={cnic} onChange={(e) => setCnic(e.target.value)} className={GATE_CONTROL} />
          )}
        </Field>
      </div>
      <Field label="Host name">
        {(id) => (
          <Input autoCapitalize="words" id={id} value={host} onChange={(e) => setHost(e.target.value)} className={GATE_CONTROL} />
        )}
      </Field>

      {/* Inline vehicle capture — optional; a registration links a vehicle. */}
      <div className="grid grid-cols-2 gap-4 border-t border-hairline pt-4">
        <Field label="Vehicle type">
          {(id) => (
            <Select
              id={id}
              value={vehicleType || undefined}
              onValueChange={setVehicleType}
              options={VEHICLE_TYPES}
              placeholder="None"
              className={`w-full ${GATE_CONTROL}`}
            />
          )}
        </Field>
        <Field label="Registration">
          {(id) => (
            <Input autoCapitalize="characters" autoCorrect="off" spellCheck={false}
              id={id}
              value={registration}
              placeholder="e.g. LEA-1234"
              onChange={(e) => setRegistration(e.target.value)}
              className={GATE_CONTROL}
            />
          )}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="h-12 px-5 text-base">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !flat || !name} className="h-12 px-6 text-base">
          Log visitor
        </Button>
      </FormActions>
    </form>
  );
}
