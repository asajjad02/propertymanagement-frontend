'use client';

import { useEffect, useMemo, useState } from 'react';

import { RatePanel, type RateRow } from '@/components/rates/rate-panel';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { electricityRateHooks, maintenanceRateHooks } from '@/hooks/resources';
import { useBuildingsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

export default function RatesPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const buildings = useBuildingsLookup();
  const [building, setBuilding] = useState<string>('');

  // Default to the first building once loaded.
  useEffect(() => {
    if (!building && buildings.data?.length) setBuilding(String(buildings.data[0].id));
  }, [building, buildings.data]);

  const buildingId = building ? Number(building) : undefined;
  const buildingOptions = useMemo(
    () => (buildings.data ?? []).map((b) => ({ value: String(b.id), label: b.name })),
    [buildings.data],
  );

  const elecList = electricityRateHooks.useList(
    { filters: { building: buildingId } },
    { enabled: buildingId != null },
  );
  const maintList = maintenanceRateHooks.useList(
    { filters: { building: buildingId } },
    { enabled: buildingId != null },
  );
  const elecCreate = electricityRateHooks.useCreate();
  const maintCreate = maintenanceRateHooks.useCreate();

  const elecRates = useMemo<RateRow[]>(
    () => (elecList.data?.results ?? []).map((r) => ({ id: r.id, value: r.rate, effective_from: r.effective_from })),
    [elecList.data],
  );
  const maintRates = useMemo<RateRow[]>(
    () => (maintList.data?.results ?? []).map((r) => ({ id: r.id, value: r.amount, effective_from: r.effective_from })),
    [maintList.data],
  );

  if (!hasRole('admin')) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rates" subtitle="Electricity and maintenance rates." />
        <EmptyState title="Admins only" description="Rate configuration is restricted to administrators." />
      </div>
    );
  }

  function addElec(value: string, effective_from: string) {
    if (!buildingId) return;
    elecCreate.mutate(
      { building: buildingId, rate: value, effective_from },
      {
        onSuccess: () => toast.success('Electricity rate added'),
        onError: (e) => toast.error('Could not add rate', toApiError(e).message),
      },
    );
  }
  function addMaint(value: string, effective_from: string) {
    if (!buildingId) return;
    maintCreate.mutate(
      { building: buildingId, amount: value, effective_from },
      {
        onSuccess: () => toast.success('Maintenance rate added'),
        onError: (e) => toast.error('Could not add rate', toApiError(e).message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rates"
        subtitle="Per-building electricity unit rate and monthly maintenance charge. New rates are effective-dated — historical bills keep the rate from their period."
        actions={
          <Select
            value={building || undefined}
            onValueChange={setBuilding}
            options={buildingOptions}
            placeholder="Select building"
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RatePanel
          title="Electricity rate"
          unitLabel="per unit"
          valueLabel="Rate per unit"
          rates={elecRates}
          isLoading={elecList.isPending && buildingId != null}
          adding={elecCreate.isPending}
          onAdd={addElec}
        />
        <RatePanel
          title="Maintenance charge"
          unitLabel="per month"
          valueLabel="Amount per month"
          rates={maintRates}
          isLoading={maintList.isPending && buildingId != null}
          adding={maintCreate.isPending}
          onAdd={addMaint}
        />
      </div>
    </div>
  );
}
