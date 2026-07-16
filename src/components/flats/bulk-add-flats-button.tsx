'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Rows3 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { bulkCreateFlats } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useApartmentTypesLookup } from '@/hooks/use-lookups';
import { queryKeys } from '@/lib/query-keys';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { OccupancyStatus } from '@/types/api';

const OCCUPANCY = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
];

/** Stand up many flats at once (a whole building) — admin/manager only. */
export function BulkAddFlatsButton() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const apartmentTypes = useApartmentTypesLookup();

  const [open, setOpen] = useState(false);
  const [apartmentType, setApartmentType] = useState('');
  const [occupancy, setOccupancy] = useState<OccupancyStatus>('vacant');
  const [numbersText, setNumbersText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const typeOptions = useMemo(
    () =>
      (apartmentTypes.data ?? [])
        .filter((t) => t.status === 'active')
        .map((t) => ({ value: String(t.id), label: t.name })),
    [apartmentTypes.data],
  );

  const create = useMutation({
    mutationFn: bulkCreateFlats,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.resource('flats').all });
      const skipped = res.skipped.length ? ` · ${res.skipped.length} skipped (already existed)` : '';
      toast.success(`${res.created} flat${res.created === 1 ? '' : 's'} added`, `${res.created} created${skipped}`);
      setNumbersText('');
      setOpen(false);
    },
    onError: (err) => setError(toApiError(err).message),
  });

  if (!hasRole('admin', 'manager')) return null;

  const flatNumbers = numbersText.split('\n').map((n) => n.trim()).filter(Boolean);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({
      apartment_type: apartmentType ? Number(apartmentType) : null,
      occupancy_status: occupancy,
      flat_numbers: flatNumbers,
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Rows3 className="h-4 w-4" />
        Add in bulk
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add flats in bulk"
        description="Stand up many flats at once. Paste one flat number per line — duplicates are skipped."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Apartment type" hint={typeOptions.length === 0 ? 'Add types in Configuration' : undefined}>
              {(id) => <Select id={id} value={apartmentType || undefined} onValueChange={setApartmentType} options={typeOptions} placeholder="Select type" className="w-full" />}
            </Field>
            <Field label="Occupancy">
              {(id) => <Select id={id} value={occupancy} onValueChange={(v) => setOccupancy(v as OccupancyStatus)} options={OCCUPANCY} className="w-full" />}
            </Field>
          </div>
          <Field label="Flat numbers" hint={`One per line${flatNumbers.length ? ` · ${flatNumbers.length} flats` : ''}`}>
            {(id) => (
              <Textarea
                id={id}
                value={numbersText}
                onChange={(e) => setNumbersText(e.target.value)}
                rows={7}
                placeholder={'A-101\nA-102\nA-103'}
              />
            )}
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || flatNumbers.length === 0}>
              Add {flatNumbers.length || ''} flats
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
