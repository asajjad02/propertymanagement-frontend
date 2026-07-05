'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { visitorHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';

/** Log a new visitor. Entry time is stamped to now; exit is recorded on checkout. */
export function VisitorForm({ onDone }: { onDone: () => void }) {
  const flats = useFlatsLookup();
  const create = visitorHooks.useCreate();
  const [flat, setFlat] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [cnic, setCnic] = useState('');
  const [host, setHost] = useState('');
  const [error, setError] = useState<string | null>(null);

  const flatOptions = useMemo(
    () => (flats.data ?? []).map((f) => ({ value: String(f.id), label: f.flat_number })),
    [flats.data],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        flat: Number(flat),
        visitor_name: name,
        contact_number: contact,
        cnic,
        host_name: host,
        entry_time: new Date().toISOString(),
        exit_time: null,
      });
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Flat visited" required>
        {(id) => (
          <Select id={id} value={flat || undefined} onValueChange={setFlat}
            options={flatOptions} placeholder="Select flat" className="w-full" />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Visitor name" required>
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
        </Field>
        <Field label="Contact number">
          {(id) => <Input id={id} value={contact} onChange={(e) => setContact(e.target.value)} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CNIC">{(id) => <Input id={id} value={cnic} onChange={(e) => setCnic(e.target.value)} />}</Field>
        <Field label="Host name">{(id) => <Input id={id} value={host} onChange={(e) => setHost(e.target.value)} />}</Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || !flat || !name}>Log visitor</Button>
      </div>
    </form>
  );
}
