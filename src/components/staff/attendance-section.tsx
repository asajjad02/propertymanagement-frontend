'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { attendanceHooks } from '@/hooks/resources';
import { shortDate } from '@/lib/format';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { AttendanceRecord } from '@/types/api';

const STATUS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
];
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '—');

export function AttendanceSection({ staffId }: { staffId: number }) {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canWrite = hasRole('admin', 'manager');
  const list = attendanceHooks.useList({ filters: { staff_member: staffId }, ordering: '-attendance_date' });
  const create = attendanceHooks.useCreate();
  const rows = useMemo(() => list.data?.results ?? [], [list.data]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ attendance_date: new Date().toISOString().slice(0, 10), status: 'present', check_in_time: '', check_out_time: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns = useMemo<ColumnDef<AttendanceRecord, unknown>[]>(
    () => [
      { id: 'attendance_date', header: 'Date', accessorFn: (r) => shortDate(r.attendance_date) },
      { id: 'status', header: 'Status', accessorFn: (r) => r.status, cell: (c) => <StatusBadge status={c.getValue<string>()} /> },
      { id: 'in', header: 'Check-in', accessorFn: (r) => hhmm(r.check_in_time) },
      { id: 'out', header: 'Check-out', accessorFn: (r) => hhmm(r.check_out_time) },
      { id: 'notes', header: 'Notes', accessorFn: (r) => r.notes || '—' },
    ],
    [],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate(
      {
        staff_member: staffId,
        attendance_date: form.attendance_date,
        status: form.status as AttendanceRecord['status'],
        check_in_time: form.check_in_time || null,
        check_out_time: form.check_out_time || null,
        notes: form.notes,
      },
      {
        onSuccess: () => { toast.success('Attendance recorded'); setOpen(false); },
        onError: (err) => setError(toApiError(err).message),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        {canWrite && (
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Mark attendance</Button>
        )}
      </CardHeader>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={list.isPending}
        ariaLabel="Attendance records"
        emptyTitle="No attendance yet"
        emptyDescription={canWrite ? 'Mark this staff member’s attendance.' : undefined}
      />
      <Modal open={open} onOpenChange={setOpen} title="Mark attendance">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>{(id) => <Input id={id} type="date" value={form.attendance_date} onChange={set('attendance_date')} required />}</Field>
            <Field label="Status">{(id) => <Select id={id} value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))} options={STATUS} className="w-full" />}</Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check-in">{(id) => <Input id={id} type="time" value={form.check_in_time} onChange={set('check_in_time')} />}</Field>
            <Field label="Check-out">{(id) => <Input id={id} type="time" value={form.check_out_time} onChange={set('check_out_time')} />}</Field>
          </div>
          <Field label="Notes">{(id) => <Input id={id} value={form.notes} onChange={set('notes')} />}</Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="hidden md:inline-flex">Cancel</Button>
            <Button type="submit" loading={create.isPending} disabled={create.isPending}>Save</Button>
          </FormActions>
        </form>
      </Modal>
    </Card>
  );
}
