'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Segmented } from '@/components/ui/segmented';
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
          {(id) => <Input autoCapitalize="words" id={id} value={form.full_name} onChange={set('full_name')} required />}
        </Field>
        <Field label="Designation" hint="e.g. Security Guard">
          {(id) => <Input autoCapitalize="words" id={id} value={form.designation} onChange={set('designation')} />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">{(id) => <Input type="tel" inputMode="tel" autoComplete="off" id={id} value={form.phone} onChange={set('phone')} />}</Field>
        <Field label="CNIC">{(id) => <Input inputMode="numeric" id={id} value={form.cnic} onChange={set('cnic')} />}</Field>
      </div>
      <Field label="Emergency contact">
        {(id) => <Input autoCapitalize="words" id={id} value={form.emergency_contact} onChange={set('emergency_contact')} />}
      </Field>
      {/* Three columns is unreadable at 390px — two here, and Status takes the
          full row so its toggle has somewhere to go. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Joining date">
          {(id) => <Input id={id} type="date" value={form.joining_date ?? ''} onChange={set('joining_date')} />}
        </Field>
        <Field label="Monthly salary">
          {(id) => <Input inputMode="decimal" id={id} type="number" min="0" step="0.01" value={form.salary} onChange={set('salary')} />}
        </Field>
        <Field label="Status" className="col-span-2 sm:col-span-1">
          {(id) => (
            // Active/inactive is a two-state switch, not a list to open.
            <Segmented
              id={id}
              options={STATUS}
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))}
            />
          )}
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">Cancel</Button>
        <Button type="submit" loading={pending} disabled={pending || !form.full_name}>
          {staff ? 'Save changes' : 'Add staff member'}
        </Button>
      </FormActions>
    </form>
  );
}
