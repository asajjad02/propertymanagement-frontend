'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { OwnerQuickForm } from '@/components/owners/owner-quick-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { flatHooks } from '@/hooks/resources';
import { useApartmentTypesLookup, useOwnersLookup, usePeopleLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import type { Flat, FlatInput } from '@/types/api';

const OCCUPANCY = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
];

export interface FlatFormProps {
  flat?: Flat;
  onDone: () => void;
  /** True while the "New owner" sub-view is showing (owned by the dialog). */
  creatingOwner?: boolean;
  onCreatingOwnerChange?: (creating: boolean) => void;
}

/** Create/edit a flat. Pass `flat` to edit; omit to create. */
export function FlatForm({
  flat,
  onDone,
  creatingOwner = false,
  onCreatingOwnerChange,
}: FlatFormProps) {
  const toast = useToast();
  const owners = useOwnersLookup();
  const people = usePeopleLookup();
  const apartmentTypes = useApartmentTypesLookup();
  const create = flatHooks.useCreate();
  const update = flatHooks.useUpdate();

  const [owner, setOwner] = useState(flat?.owner ? String(flat.owner) : '');
  const [apartmentType, setApartmentType] = useState(flat?.apartment_type ? String(flat.apartment_type) : '');
  const [flatNumber, setFlatNumber] = useState(flat?.flat_number ?? '');
  const [floor, setFloor] = useState(String(flat?.floor_number ?? 1));
  const [occupancy, setOccupancy] = useState(flat?.occupancy_status ?? 'vacant');
  const [error, setError] = useState<string | null>(null);

  function resetForFlatEntry() {
    // Keep type/occupancy (likely the same for the next unit); clear the
    // per-unit fields so the user can keep entering flats quickly.
    setFlatNumber('');
    setOwner('');
    setError(null);
  }

  const ownerOptions = useMemo(
    () =>
      (owners.data ?? []).map((o) => ({
        value: String(o.id),
        label: people.map.get(o.person)?.full_name ?? `Owner #${o.id}`,
      })),
    [owners.data, people.map],
  );

  const typeOptions = useMemo(
    () =>
      (apartmentTypes.data ?? [])
        .filter((t) => t.status === 'active')
        .map((t) => ({ value: String(t.id), label: t.name })),
    [apartmentTypes.data],
  );

  const pending = create.isPending || update.isPending;

  async function submit(closeAfter: boolean) {
    setError(null);
    const typeName = apartmentType ? apartmentTypes.map.get(Number(apartmentType))?.name : undefined;
    const payload: FlatInput = {
      owner: owner ? Number(owner) : null,
      apartment_type: apartmentType ? Number(apartmentType) : null,
      flat_number: flatNumber,
      floor_number: Number(floor),
      // Keep the legacy flat_type label in sync with the chosen type.
      flat_type: typeName ?? flat?.flat_type ?? 'standard',
      occupancy_status: occupancy as FlatInput['occupancy_status'],
    };
    try {
      if (flat) await update.mutateAsync({ id: flat.id, payload });
      else await create.mutateAsync(payload);
      toast.success(flat ? 'Flat updated' : 'Flat added', `${flatNumber} saved.`);
      if (closeAfter) onDone();
      else resetForFlatEntry();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit(true);
  }

  return (
    <>
      {/*
       * Hidden rather than unmounted while the owner sub-view is up: everything
       * already typed into the flat form has to still be here when the user
       * comes back. A sibling of the owner form, never a parent — nesting one
       * <form> inside another is invalid HTML.
       */}
      <form onSubmit={onSubmit} className={cn('space-y-4', creatingOwner && 'hidden')}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Flat number" required>
            {(id) => (
              <Input
                id={id}
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                // Flat numbers are codes like A-101 — uppercase, never autocorrected.
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                autoFocus={!flat}
                required
              />
            )}
          </Field>
          <Field label="Floor">
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={0}
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="Apartment type" hint={typeOptions.length === 0 ? 'Add types in Configuration' : undefined}>
          {(id) => (
            <Select
              id={id}
              value={apartmentType || undefined}
              onValueChange={setApartmentType}
              options={typeOptions}
              placeholder="Select type"
              className="w-full"
            />
          )}
        </Field>

        {/* Two mutually exclusive states — both worth seeing at once, and one
            tap to switch. A dropdown here hid half the answer behind a tap. */}
        <Field label="Occupancy">
          {(id) => (
            <Segmented
              id={id}
              options={OCCUPANCY}
              value={occupancy}
              onValueChange={(v) => setOccupancy(v as typeof occupancy)}
            />
          )}
        </Field>

        <Field label="Owner" hint="Optional">
          {(id) => (
            <div className="flex items-center gap-2">
              {/* Owners grow without bound, so this is type-to-filter rather
                  than a scrolling list. */}
              <SearchableSelect
                id={id}
                value={owner || undefined}
                onValueChange={setOwner}
                options={ownerOptions}
                placeholder="No owner"
                searchPlaceholder="Search owners…"
                className="w-full flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => onCreatingOwnerChange?.(true)}
                aria-label="Create a new owner"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          )}
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <FormActions>
          {/* Mobile dismisses by swipe, backdrop or the header's ✕, so Cancel is
              dead weight there; the desktop dialog keeps it. "Save & add
              another" is a desk-bound bulk-entry habit — same treatment. */}
          <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">
            Cancel
          </Button>
          {!flat && (
            <Button
              type="button"
              variant="secondary"
              loading={pending} disabled={pending || !flatNumber}
              onClick={() => void submit(false)}
              className="hidden md:inline-flex"
            >
              Save &amp; add another
            </Button>
          )}
          <Button type="submit" loading={pending} disabled={pending || !flatNumber}>
            {flat ? 'Save changes' : 'Add flat'}
          </Button>
        </FormActions>
      </form>

      {creatingOwner && (
        <div className="motion-safe:animate-[subview-in_180ms_ease-out]">
          <OwnerQuickForm
            onCreated={(ownerId) => {
              // Select the new owner and drop straight back to the flat form.
              setOwner(String(ownerId));
              onCreatingOwnerChange?.(false);
            }}
            onCancel={() => onCreatingOwnerChange?.(false)}
          />
        </div>
      )}
    </>
  );
}
