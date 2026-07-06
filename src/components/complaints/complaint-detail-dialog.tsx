'use client';

import { DocumentImage } from '@/components/documents/document-image';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { StaffSelect, UNASSIGNED } from '@/components/staff/staff-select';
import type { ComplaintRow } from '@/hooks/use-complaint-rows';
import { complaintHooks } from '@/hooks/resources';
import { dateTime } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import type { ComplaintStatus } from '@/types/api';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

/** View a complaint's full detail and, for write roles, change status / assign staff. */
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
  const patch = complaintHooks.usePatch();
  // Detail carries the embedded documents (the list row does not).
  const detail = complaintHooks.useItem(row?.complaint.id);
  const canWrite = hasRole('admin', 'manager');

  if (!row) return null;
  const { complaint, flatNumber, staffName } = row;
  const images = (detail.data?.documents ?? []).filter((d) => d.content_type.startsWith('image/'));

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={complaint.complaint_type}
      description={`Flat ${flatNumber} · Reported ${dateTime(complaint.reported_at)}`}>
      <div className="space-y-5">
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
                onValueChange={(v) => patch.mutate({ id: complaint.id, payload: { status: v as ComplaintStatus } })}
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
                  patch.mutate({
                    id: complaint.id,
                    payload: { assigned_staff: v === UNASSIGNED ? null : Number(v) },
                  })
                }
              />
            ) : (
              <p className="text-sm text-ink">{staffName ?? 'Unassigned'}</p>
            )}
          </div>
        </div>

        {complaint.resolved_at && (
          <p className="text-xs text-muted">Resolved {dateTime(complaint.resolved_at)}</p>
        )}
      </div>
    </Modal>
  );
}
