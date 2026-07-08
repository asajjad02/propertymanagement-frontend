'use client';

import { useMemo, useState } from 'react';

import { uploadDocument } from '@/api/documents';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { complaintHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import type { ComplaintPriority } from '@/types/api';

import { PRIORITY_OPTIONS } from './priority';

// Common complaint types (the backend stores a free-form string).
const TYPES = ['Plumbing', 'Electrical', 'Elevator', 'Security', 'Cleaning', 'Parking', 'Noise', 'Other'];

/** Log a new complaint against a flat, with an optional photo. */
export function ComplaintForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const flats = useFlatsLookup();
  const create = complaintHooks.useCreate();
  const [flat, setFlat] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('routine');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set once the complaint exists, so a retry (e.g. after an upload hiccup)
  // uploads the photos instead of creating a duplicate complaint.
  const [createdId, setCreatedId] = useState<number | null>(null);

  const flatOptions = useMemo(
    () => (flats.data ?? []).map((f) => ({ value: String(f.id), label: f.flat_number })),
    [flats.data],
  );
  const typeOptions = TYPES.map((t) => ({ value: t, label: t }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let id = createdId;
      if (id == null) {
        const complaint = await create.mutateAsync({ flat: Number(flat), complaint_type: type, description, priority });
        id = complaint.id;
        setCreatedId(id);
      }
      // Upload one at a time, dropping each on success so a retry only
      // re-attempts the photos that didn't make it (no duplicates).
      const queue = [...images];
      try {
        while (queue.length) {
          await uploadDocument({ file: queue[0], related_model: 'complaint', related_id: id, document_type: 'photo' });
          queue.shift();
        }
      } finally {
        setImages(queue);
      }
      toast.success('Complaint logged');
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Flat" required>
          {(id) => (
            <Select id={id} value={flat || undefined} onValueChange={setFlat}
              options={flatOptions} placeholder="Select flat" className="w-full" />
          )}
        </Field>
        <Field label="Type" required>
          {(id) => (
            <Select id={id} value={type || undefined} onValueChange={setType}
              options={typeOptions} placeholder="Select type" className="w-full" />
          )}
        </Field>
      </div>
      <Field label="Priority" hint="How urgent is this issue?">
        {() => (
          <Segmented
            options={PRIORITY_OPTIONS}
            value={priority}
            onValueChange={(v) => setPriority(v as ComplaintPriority)}
          />
        )}
      </Field>
      <Field label="Description" required>
        {(id) => <Textarea id={id} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />}
      </Field>
      <Field label="Photos" hint="Optional — attach one or more images">
        {() => <ImageUploader value={images} onChange={setImages} />}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={busy || !flat || !type || !description}>
          {createdId != null ? 'Retry photo upload' : 'Log complaint'}
        </Button>
      </div>
    </form>
  );
}
