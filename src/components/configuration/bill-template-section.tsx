'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { fetchBillTemplate, updateBillTemplate } from '@/api/endpoints';
import { uploadDocument } from '@/api/documents';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { toApiError } from '@/lib/errors';
import type { BillTemplate, DueDateMode } from '@/types/api';

const TEMPLATE_KEY = ['billing', 'template'] as const;

type FormState = {
  header_title: string;
  header_subtitle: string;
  brand_color: string;
  payee_name: string;
  bank_name: string;
  bank_branch: string;
  account_number: string;
  iban: string;
  support_phone: string;
  late_fee: string;
  due_mode: string; // DueDateMode; kept as string so the generic setter stays clean
  due_days: string;
  due_day_of_month: string;
  instructions: string; // one line per instruction
};

function toForm(t: BillTemplate): FormState {
  return {
    header_title: t.header_title,
    header_subtitle: t.header_subtitle,
    brand_color: t.brand_color,
    payee_name: t.payee_name,
    bank_name: t.bank_name,
    bank_branch: t.bank_branch,
    account_number: t.account_number,
    iban: t.iban,
    support_phone: t.support_phone,
    late_fee: t.late_fee,
    due_mode: t.due_mode,
    due_days: String(t.due_days),
    due_day_of_month: String(t.due_day_of_month),
    instructions: (t.instructions ?? []).join('\n'),
  };
}

/**
 * Edits the account's bill template (branding, payee/bank details, late-fee
 * rule, instructions) with a live preview. The preview embeds the *backend*
 * render of the template — the same renderer that produces real bills — so what
 * you see here is exactly what residents get.
 */
export function BillTemplateSection() {
  const toast = useToast();
  const qc = useQueryClient();
  const logoInput = useRef<HTMLInputElement>(null);

  const template = useQuery({ queryKey: TEMPLATE_KEY, queryFn: fetchBillTemplate });
  const [form, setForm] = useState<FormState | null>(null);
  // Bumped after a save/logo change to reload the (iframe) preview.
  const [previewNonce, setPreviewNonce] = useState(0);

  // Seed the form once the template loads (and only then, so typing isn't
  // clobbered by a refetch).
  useEffect(() => {
    if (template.data && form === null) setForm(toForm(template.data));
  }, [template.data, form]);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = useMutation({
    mutationFn: () =>
      updateBillTemplate({
        header_title: form!.header_title,
        header_subtitle: form!.header_subtitle,
        brand_color: form!.brand_color,
        payee_name: form!.payee_name,
        bank_name: form!.bank_name,
        bank_branch: form!.bank_branch,
        account_number: form!.account_number,
        iban: form!.iban,
        support_phone: form!.support_phone,
        late_fee: form!.late_fee,
        due_mode: form!.due_mode as DueDateMode,
        due_days: Number(form!.due_days) || 0,
        due_day_of_month: Math.min(Math.max(Number(form!.due_day_of_month) || 1, 1), 31),
        instructions: form!.instructions.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(TEMPLATE_KEY, updated);
      setPreviewNonce((n) => n + 1);
      toast.success('Bill template saved');
    },
    onError: (e) => toast.error('Could not save', toApiError(e).message),
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const doc = await uploadDocument({
        file,
        related_model: 'bill_template',
        related_id: template.data!.id,
        document_type: 'logo',
      });
      return updateBillTemplate({ logo: doc.id });
    },
    onSuccess: (updated) => {
      qc.setQueryData(TEMPLATE_KEY, updated);
      setPreviewNonce((n) => n + 1);
      toast.success('Logo updated');
    },
    onError: (e) => toast.error('Could not upload logo', toApiError(e).message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill template</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ---- Editor ---- */}
          <div className="space-y-4">
            {!form ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Header title" hint="Defaults to your account name">
                    {(id) => <Input id={id} value={form.header_title} onChange={(e) => set('header_title', e.target.value)} />}
                  </Field>
                  <Field label="Subtitle">
                    {(id) => <Input id={id} value={form.header_subtitle} onChange={(e) => set('header_subtitle', e.target.value)} />}
                  </Field>
                </div>

                <div className="flex items-start gap-4">
                  <Field label="Brand colour" className="shrink-0">
                    {(id) => (
                      <input
                        id={id}
                        type="color"
                        value={form.brand_color}
                        onChange={(e) => set('brand_color', e.target.value)}
                        className="h-9.5 w-16 cursor-pointer rounded-control border border-hairline bg-surface"
                      />
                    )}
                  </Field>
                  <Field label="Logo" className="flex-1" hint="PNG or JPEG">
                    {() => (
                      <div className="flex items-center gap-2">
                        <input ref={logoInput} type="file" accept="image/png,image/jpeg" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f); }} />
                        <Button type="button" variant="secondary" loading={uploadLogo.isPending}
                          onClick={() => logoInput.current?.click()}>
                          {template.data?.logo ? 'Replace logo' : 'Upload logo'}
                        </Button>
                        {template.data?.logo && <span className="text-xs text-muted">Logo set</span>}
                      </div>
                    )}
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Payee name">
                    {(id) => <Input id={id} value={form.payee_name} onChange={(e) => set('payee_name', e.target.value)} />}
                  </Field>
                  <Field label="Support phone" hint="For online payments">
                    {(id) => <Input id={id} value={form.support_phone} onChange={(e) => set('support_phone', e.target.value)} />}
                  </Field>
                  <Field label="Bank name">
                    {(id) => <Input id={id} value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} />}
                  </Field>
                  <Field label="Bank branch">
                    {(id) => <Input id={id} value={form.bank_branch} onChange={(e) => set('bank_branch', e.target.value)} />}
                  </Field>
                  <Field label="Account number">
                    {(id) => <Input id={id} value={form.account_number} onChange={(e) => set('account_number', e.target.value)} />}
                  </Field>
                  <Field label="IBAN">
                    {(id) => <Input id={id} value={form.iban} onChange={(e) => set('iban', e.target.value)} />}
                  </Field>
                  <Field label="Late fee" hint="Added after the due date">
                    {(id) => <Input id={id} type="number" inputMode="decimal" value={form.late_fee} onChange={(e) => set('late_fee', e.target.value)} />}
                  </Field>
                </div>

                <Field label="Due date rule" hint="How the bill's due date is worked out">
                  {() => (
                    <div className="space-y-3">
                      <Segmented
                        options={[
                          { value: 'days_after', label: 'Days after period end' },
                          { value: 'fixed_day', label: 'Fixed day of next month' },
                        ]}
                        value={form.due_mode}
                        onValueChange={(v) => set('due_mode', v)}
                      />
                      {form.due_mode === 'fixed_day' ? (
                        <Field label="Day of month" hint="e.g. 10 → always due the 10th of the next month">
                          {(id) => (
                            <Input
                              id={id}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={31}
                              value={form.due_day_of_month}
                              onChange={(e) => set('due_day_of_month', e.target.value)}
                            />
                          )}
                        </Field>
                      ) : (
                        <Field label="Due days" hint="Days after the billing period ends">
                          {(id) => (
                            <Input
                              id={id}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={form.due_days}
                              onChange={(e) => set('due_days', e.target.value)}
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  )}
                </Field>

                <Field label="Payment instructions" hint="One line per instruction">
                  {(id) => <Textarea id={id} rows={4} value={form.instructions} onChange={(e) => set('instructions', e.target.value)} />}
                </Field>

                <div className="flex justify-end">
                  <Button type="button" loading={save.isPending} onClick={() => save.mutate()}>
                    Save template
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ---- Live preview: the same browser-rendered template as a real
              bill, with sample figures + saved branding. Reloaded on save. ---- */}
          <div className="space-y-2">
            <p className="label-mono">Preview</p>
            <div className="overflow-hidden rounded-card border border-hairline bg-raised">
              <iframe
                key={previewNonce}
                src={`/print/bill-preview?embed=1&v=${previewNonce}`}
                title="Bill template preview"
                className="block w-full border-0"
                style={{ aspectRatio: '210 / 297' }}
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
