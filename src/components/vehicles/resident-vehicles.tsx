'use client';

import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { vehicleHooks } from '@/hooks/resources';
import { useAuth } from '@/providers/auth-provider';
import type { Vehicle } from '@/types/api';

import { VehicleForm } from './vehicle-form';
import { VehicleList } from './vehicle-list';

/** Editable vehicle list for a resident: add / edit / delete (write roles). */
export function ResidentVehicles({ personId, vehicles }: { personId: number; vehicles: Vehicle[] }) {
  const { hasRole } = useAuth();
  const del = vehicleHooks.useDelete();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const canWrite = hasRole('admin', 'manager');

  if (!canWrite) return <VehicleList vehicles={vehicles} />;

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(v: Vehicle) {
    setEditing(v);
    setFormOpen(true);
  }

  return (
    <>
      <VehicleList
        vehicles={vehicles}
        headerAction={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />Add</Button>}
        rowAction={(v) => (
          <DropdownMenu
            trigger={
              <button aria-label="Vehicle actions" className="rounded-control p-1 text-muted hover:bg-raised hover:text-ink">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
            items={[
              { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onSelect: () => openEdit(v) },
              { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setDeleting(v) },
            ]}
          />
        )}
      />

      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit vehicle' : 'Add vehicle'}>
        <VehicleForm personId={personId} vehicle={editing ?? undefined} onDone={() => setFormOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete vehicle?"
        description={deleting ? `${deleting.registration_number || deleting.vehicle_type} will be removed.` : undefined}
        confirmLabel="Delete"
        danger
        loading={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
