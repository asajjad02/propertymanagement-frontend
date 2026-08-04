'use client';

import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { meters as metersApi } from '@/api/endpoints';
import { OwnerQuickForm } from '@/components/owners/owner-quick-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { flatHooks, meterHooks } from '@/hooks/resources';
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
}

/** Create/edit a flat. Pass `flat` to edit; omit to create. */
export function FlatForm({ flat, onDone }: FlatFormProps) {
  const toast = useToast();
  const owners = useOwnersLookup();
  const people = usePeopleLookup();
  const apartmentTypes = useApartmentTypesLookup();
  const create = flatHooks.useCreate();
  const update = flatHooks.useUpdate();
  const patchMeter = meterHooks.usePatch();

  const [owner, setOwner] = useState(flat?.owner ? String(flat.owner) : '');
  const [apartmentType, setApartmentType] = useState(flat?.apartment_type ? String(flat.apartment_type) : '');
  const [flatNumber, setFlatNumber] = useState(flat?.flat_number ?? '');
  const [floor, setFloor] = useState(String(flat?.floor_number ?? 1));
  const [occupancy, setOccupancy] = useState(flat?.occupancy_status ?? 'vacant');
  const [error, setError] = useState<string | null>(null);
  const [addingOwner, setAddingOwner] = useState(false);
  /*
   * The backend gives every new flat a meter starting at 0. A real meter on a
   * real wall doesn't read 0, and billing `current - 0` would charge the
   * resident for its entire lifetime. Capturing it here means the first bill is
   * right without anyone having to remember; left blank it stays 0, which is
   * correct for a genuinely new meter.
   */
  const [meterReading, setMeterReading] = useState('');
  // Money owed before the system. Applied to this flat's first bill's previous
  // balance; editable, but only meaningful before the first bill is issued.
  const [openingBalance, setOpeningBalance] = useState(flat?.opening_balance ?? '');

  function resetForFlatEntry() {
    // Keep type/occupancy (likely the same for the next unit); clear the
    // per-unit fields so the user can keep entering flats quickly.
    setFlatNumber('');
    setOwner('');
    setMeterReading('');
    setOpeningBalance('');
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

  const pending = create.isPending || update.isPending || patchMeter.isPending;

  /**
   * Set the starting reading on the meter the backend just created with the flat.
   *
   * Two requests because flat-create doesn't accept an initial reading — see
   * docs/backend/mobile-rebuild-plan.md §2. A failure here is reported but not
   * treated as a failed save: the flat exists, and the reading can be corrected
   * on the first meter round.
   */
  async function setStartingReading(flatId: number) {
    const value = meterReading.trim();
    if (!value || Number(value) === 0) return;
    try {
      const { results } = await metersApi.list({ filters: { flat: flatId } });
      const meter = results[0];
      if (!meter) return;
      await patchMeter.mutateAsync({
        id: meter.id,
        payload: { current_reading: value, previous_reading: value },
      });
    } catch {
      toast.warning(
        'Flat saved, meter reading not set',
        `${flatNumber}: set the starting reading on the next meter round.`,
      );
    }
  }

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
      opening_balance: openingBalance === '' ? '0' : openingBalance,
    };
    try {
      if (flat) {
        await update.mutateAsync({ id: flat.id, payload });
      } else {
        const created = await create.mutateAsync(payload);
        await setStartingReading(created.id);
      }
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
      <form onSubmit={onSubmit} className="space-y-4">
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

        {/* Creating only: the flat's meter is made server-side starting at 0,
            and only the person standing at it knows what it really reads. */}
        {!flat && (
          <Field
            label="Current meter reading"
            hint="Optional — what the meter reads today. Leave blank for a brand-new meter."
          >
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                min={0}
                value={meterReading}
                onChange={(e) => setMeterReading(e.target.value)}
                placeholder="0"
                className="tabular-nums"
              />
            )}
          </Field>
        )}

        {/* Any balance owed before the system. Folds into this flat's first
            bill's previous balance, so the first bill is right without a manual
            adjustment. Only meaningful before the first bill is issued. */}
        <Field
          label="Opening balance"
          hint="Amount owed before the system, if any. Added to this flat's first bill."
        >
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              className="tabular-nums"
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

        <Field label="Owner" hint={addingOwner ? undefined : 'Optional'}>
          {(id) => (
            <div className="space-y-3">
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
                  disabled={addingOwner}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAddingOwner((v) => !v)}
                  aria-expanded={addingOwner}
                  aria-label={addingOwner ? 'Cancel new owner' : 'Create a new owner'}
                >
                  {addingOwner ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {addingOwner ? 'Cancel' : 'New'}
                </Button>
              </div>

              {/*
               * The owner's fields open in place, under the picker they belong
               * to. Pushing a sub-view for three fields hid the flat you were
               * halfway through describing and made a small aside feel like
               * leaving the task.
               */}
              {addingOwner && (
                <div className="rounded-control border border-hairline bg-raised p-3 motion-safe:animate-[subview-in_160ms_ease-out]">
                  <OwnerQuickForm
                    autoFocus
                    submitLabel="Add owner"
                    onCreated={(ownerId) => {
                      setOwner(String(ownerId));
                      setAddingOwner(false);
                    }}
                  />
                </div>
              )}
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
    </>
  );
}
