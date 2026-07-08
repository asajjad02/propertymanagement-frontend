'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { salaryPaymentHooks } from '@/hooks/resources';
import { money, shortDate } from '@/lib/format';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { SalaryPayment } from '@/types/api';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
];

export function SalarySection({ staffId }: { staffId: number }) {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canWrite = hasRole('admin', 'manager');
  const list = salaryPaymentHooks.useList({ filters: { staff_member: staffId }, ordering: '-payment_date' });
  const create = salaryPaymentHooks.useCreate();
  const rows = useMemo(() => list.data?.results ?? [], [list.data]);
  const totalPaid = useMemo(() => rows.reduce((s, p) => s + (Number(p.amount) || 0), 0), [rows]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ payment_date: new Date().toISOString().slice(0, 10), amount: '', payment_method: 'bank_transfer', reference_number: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const columns = useMemo<ColumnDef<SalaryPayment, unknown>[]>(
    () => [
      { id: 'payment_date', header: 'Date', accessorFn: (r) => shortDate(r.payment_date) },
      { id: 'amount', header: 'Amount', accessorFn: (r) => money(r.amount), meta: { align: 'right' } },
      { id: 'method', header: 'Method', accessorFn: (r) => r.payment_method.replace('_', ' ') },
      { id: 'ref', header: 'Reference', accessorFn: (r) => r.reference_number || '—' },
    ],
    [],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate(
      {
        staff_member: staffId,
        payment_date: form.payment_date,
        amount: form.amount || '0',
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        notes: form.notes,
      },
      {
        onSuccess: () => { toast.success('Salary payment recorded', money(form.amount)); setOpen(false); },
        onError: (err) => setError(toApiError(err).message),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary payments {rows.length > 0 && <span className="ml-1 text-muted">· {money(totalPaid)} total</span>}</CardTitle>
        {canWrite && (
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Record payment</Button>
        )}
      </CardHeader>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={list.isPending}
        ariaLabel="Salary payments"
        emptyTitle="No payments yet"
        emptyDescription={canWrite ? 'Record a salary payment for this staff member.' : undefined}
      />
      <Modal open={open} onOpenChange={setOpen} title="Record salary payment">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Payment date" required>{(id) => <Input id={id} type="date" value={form.payment_date} onChange={set('payment_date')} required />}</Field>
            <Field label="Amount" required>{(id) => <Input id={id} type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} required />}</Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Method">{(id) => <Select id={id} value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v }))} options={METHODS} className="w-full" />}</Field>
            <Field label="Reference">{(id) => <Input id={id} value={form.reference_number} onChange={set('reference_number')} />}</Field>
          </div>
          <Field label="Notes">{(id) => <Input id={id} value={form.notes} onChange={set('notes')} />}</Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !form.amount}>Record payment</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
