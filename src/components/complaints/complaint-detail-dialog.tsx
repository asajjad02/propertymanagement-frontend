'use client';

import { useEffect, useState } from 'react';

import { uploadDocument } from '@/api/documents';
import { DocumentImage } from '@/components/documents/document-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { StaffSelect, UNASSIGNED } from '@/components/staff/staff-select';
import type { ComplaintRow } from '@/hooks/use-complaint-rows';
import { complaintHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import { dateTime, money } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import type { ComplaintStatus } from '@/types/api';

import { PRIORITY_LABEL, PRIORITY_TONE } from './priority';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

/** View a complaint's full detail and, for write roles, change status / assign staff / record its resolution. */
export function ComplaintDetailDialog({
  row,
  open,
  onOpenChange,
}: {
  row: ComplaintRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hasRole } = useAuth();
  const toast = useToast();
  const patch = complaintHooks.usePatch();
  const notifyUpdated = () => toast.success('Complaint updated');
  // Detail carries the embedded documents (the list row does not).
  const detail = complaintHooks.useItem(row?.complaint.id);
  const canWrite = hasRole('admin', 'manager');

  // Resolution capture (note / cost / before-after photos).
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const complaintId = row?.complaint.id;
  const initialNote = row?.complaint.resolution_note ?? '';
  const initialCost = row?.complaint.resolution_cost ?? '';
  // Re-seed the editable fields when a different complaint is opened.
  useEffect(() => {
    setNote(initialNote);
    setCost(initialCost);
    setBeforePhotos([]);
    setAfterPhotos([]);
    setSaveError(null);
  }, [complaintId, open, initialNote, initialCost]);

  if (!row) return null;
  const { complaint, flatNumber, staffName } = row;
  const images = (detail.data?.documents ?? []).filter((d) => d.content_type.startsWith('image/'));
  const isResolved = complaint.status === 'resolved';

  async function saveResolution() {
    setBusy(true);
    setSaveError(null);
    try {
      // Upload staged photos first so the refreshed detail includes them.
      // Drop each on success so a retry only re-attempts the ones that failed.
      const beforeQueue = [...beforePhotos];
      try {
        while (beforeQueue.length) {
          await uploadDocument({ file: beforeQueue[0], related_model: 'complaint', related_id: complaint.id, document_type: 'before' });
          beforeQueue.shift();
        }
      } finally {
        setBeforePhotos(beforeQueue);
      }
      const afterQueue = [...afterPhotos];
      try {
        while (afterQueue.length) {
          await uploadDocument({ file: afterQueue[0], related_model: 'complaint', related_id: complaint.id, document_type: 'after' });
          afterQueue.shift();
        }
      } finally {
        setAfterPhotos(afterQueue);
      }
      await patch.mutateAsync({
        id: complaint.id,
        payload: { resolution_note: note, resolution_cost: cost.trim() === '' ? null : cost.trim() },
      });
      toast.success('Complaint updated');
    } catch (err) {
      setSaveError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={complaint.complaint_type}
      description={`Flat ${flatNumber} · Reported ${dateTime(complaint.reported_at)}`}>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge tone={PRIORITY_TONE[complaint.priority]}>{PRIORITY_LABEL[complaint.priority]}</Badge>
          <StatusBadge status={complaint.status} />
        </div>

        <div>
          <p className="label-mono mb-1">Description</p>
          <p className="text-sm text-ink whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {images.length > 0 && (
          <div>
            <p className="label-mono mb-1.5">Photos</p>
            <div className="flex flex-wrap gap-2">
              {images.map((doc) => (
                <DocumentImage key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="label-mono mb-1.5">Status</p>
            {canWrite ? (
              <Select
                value={complaint.status}
                onValueChange={(v) =>
                  patch.mutate(
                    { id: complaint.id, payload: { status: v as ComplaintStatus } },
                    { onSuccess: notifyUpdated },
                  )
                }
                options={STATUS_OPTIONS}
                className="w-full"
              />
            ) : (
              <StatusBadge status={complaint.status} />
            )}
          </div>
          <div>
            <p className="label-mono mb-1.5">Assigned staff</p>
            {canWrite ? (
              <StaffSelect
                includeUnassigned
                value={complaint.assigned_staff != null ? String(complaint.assigned_staff) : UNASSIGNED}
                onValueChange={(v) =>
                  patch.mutate(
                    {
                      id: complaint.id,
                      payload: { assigned_staff: v === UNASSIGNED ? null : Number(v) },
                    },
                    { onSuccess: notifyUpdated },
                  )
                }
              />
            ) : (
              <p className="text-sm text-ink">{staffName ?? 'Unassigned'}</p>
            )}
          </div>
        </div>

        {isResolved && (
          <div className="space-y-4 border-t border-hairline pt-4">
            <p className="label-mono">Resolution</p>
            {canWrite ? (
              <>
                <Field label="Resolution note" hint="What was done to resolve this?">
                  {(id) => (
                    <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                      placeholder="Replaced the burst valve; tested for leaks." />
                  )}
                </Field>
                <Field label="Resolution cost" hint="Total cost of the fix (optional)">
                  {(id) => (
                    <Input id={id} type="number" min="0" step="0.01" inputMode="decimal"
                      value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Before photos" hint="Optional">
                    {() => <ImageUploader value={beforePhotos} onChange={setBeforePhotos} />}
                  </Field>
                  <Field label="After photos" hint="Optional">
                    {() => <ImageUploader value={afterPhotos} onChange={setAfterPhotos} />}
                  </Field>
                </div>
                {saveError && <p className="text-sm text-danger">{saveError}</p>}
                <div className="flex justify-end">
                  <Button type="button" onClick={saveResolution} disabled={busy}>
                    Save resolution
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="label-mono mb-1">Note</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{complaint.resolution_note || '—'}</p>
                </div>
                <div>
                  <p className="label-mono mb-1">Cost</p>
                  <p className="text-sm text-ink">{money(complaint.resolution_cost)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {complaint.resolved_at && (
          <p className="text-xs text-muted">Resolved {dateTime(complaint.resolved_at)}</p>
        )}
      </div>
    </Modal>
  );
}
