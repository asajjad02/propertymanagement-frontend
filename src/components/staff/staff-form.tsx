'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { staffMemberHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { StaffMember, StaffMemberInput } from '@/types/api';

const STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/** Create/edit a staff member. Pass `staff` to edit; omit to create. */
export function StaffForm({ staff, onDone }: { staff?: StaffMember; onDone: () => void }) {
  const toast = useToast();
  const create = staffMemberHooks.useCreate();
  const update = staffMemberHooks.useUpdate();

  const [form, setForm] = useState({
    full_name: staff?.full_name ?? '',
    designation: staff?.designation ?? '',
    phone: staff?.phone ?? '',
    cnic: staff?.cnic ?? '',
    emergency_contact: staff?.emergency_contact ?? '',
    joining_date: staff?.joining_date ?? '',
    salary: staff?.salary ?? '',
    status: staff?.status ?? 'active',
  });
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: StaffMemberInput = {
      full_name: form.full_name,
      designation: form.designation,
      phone: form.phone,
      cnic: form.cnic,
      emergency_contact: form.emergency_contact,
      joining_date: form.joining_date || null,
      salary: form.salary || '0',
      status: form.status as StaffMemberInput['status'],
    };
    try {
      if (staff) await update.mutateAsync({ id: staff.id, payload });
      else await create.mutateAsync(payload);
      toast.success(staff ? 'Staff member updated' : 'Staff member added', form.full_name);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full name" required>
          {(id) => <Input id={id} value={form.full_name} onChange={set('full_name')} required />}
        </Field>
        <Field label="Designation" hint="e.g. Security Guard">
          {(id) => <Input id={id} value={form.designation} onChange={set('designation')} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">{(id) => <Input id={id} value={form.phone} onChange={set('phone')} />}</Field>
        <Field label="CNIC">{(id) => <Input id={id} value={form.cnic} onChange={set('cnic')} />}</Field>
      </div>
      <Field label="Emergency contact">
        {(id) => <Input id={id} value={form.emergency_contact} onChange={set('emergency_contact')} />}
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Joining date">
          {(id) => <Input id={id} type="date" value={form.joining_date ?? ''} onChange={set('joining_date')} />}
        </Field>
        <Field label="Monthly salary">
          {(id) => <Input id={id} type="number" min="0" step="0.01" value={form.salary} onChange={set('salary')} />}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))} options={STATUS} className="w-full" />
          )}
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending || !form.full_name}>
          {staff ? 'Save changes' : 'Add staff member'}
        </Button>
      </div>
    </form>
  );
}
