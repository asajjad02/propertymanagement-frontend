'use client';

import { ClipboardCheck, Plus } from 'lucide-react';
import { useState } from 'react';

import { uploadDocument } from '@/api/documents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Segmented } from '@/components/ui/segmented';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { inspectionHooks } from '@/hooks/resources';
import { shortDate } from '@/lib/format';
import { toApiError } from '@/lib/errors';
import type { InspectionKind } from '@/types/api';

const KIND_TABS = [
  { value: 'move_in', label: 'Move-in' },
  { value: 'move_out', label: 'Move-out' },
];
const TODAY = new Date().toISOString().slice(0, 10);

/** Move-in / move-out condition inspections for a flat, with photo evidence. */
export function InspectionsCard({ flatId, occupantId }: { flatId: number; occupantId: number | null }) {
  const toast = useToast();
  const list = inspectionHooks.useList({ filters: { flat: flatId }, ordering: '-inspection_date' });
  const create = inspectionHooks.useCreate();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<InspectionKind>('move_in');
  const [date, setDate] = useState(TODAY);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const rows = list.data?.results ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const inspection = await create.mutateAsync({
        flat: flatId,
        occupant: occupantId,
        kind,
        inspection_date: date,
        notes,
      });
      for (const file of photos) {
        try {
          await uploadDocument({ file, related_model: 'inspection', related_id: inspection.id, document_type: kind });
        } catch {
          toast.warning('Inspection saved, a photo failed to upload');
        }
      }
      toast.success('Inspection recorded');
      setOpen(false);
      setNotes('');
      setPhotos([]);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspections</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No inspections yet" description="Record a move-in or move-out condition report with photos." className="py-8" />
      ) : (
        <ul className="divide-y divide-hairline">
          {rows.map((insp) => (
            <li key={insp.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={insp.kind === 'move_in' ? 'green' : 'amber'}>
                  {insp.kind === 'move_in' ? 'Move-in' : 'Move-out'}
                </Badge>
                <span className="text-xs text-muted">{shortDate(insp.inspection_date)}</span>
              </div>
              {insp.notes && <p className="mt-1.5 text-sm text-ink-secondary">{insp.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onOpenChange={setOpen} title="Record inspection" description="Capture the flat's condition at move-in or move-out.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Type">
            {() => <Segmented options={KIND_TABS} value={kind} onValueChange={(v) => setKind(v as InspectionKind)} />}
          </Field>
          <Field label="Date">{(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Notes" hint="Condition, damages, meter readings…">
            {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />}
          </Field>
          <Field label="Photos" hint="Condition evidence (optional)">
            {() => <ImageUploader value={photos} onChange={setPhotos} />}
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Save inspection</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
