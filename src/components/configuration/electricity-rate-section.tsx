'use client';

import { useMemo } from 'react';

import { RatePanel, type RateRow } from '@/components/rates/rate-panel';
import { useToast } from '@/components/ui/toast';
import { electricityRateHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

/**
 * Electricity unit rate configuration. Effective-dated — historical bills keep
 * the rate from their period. (Maintenance is configured per apartment type.)
 */
export function ElectricityRateSection() {
  const toast = useToast();
  const list = electricityRateHooks.useList();
  const create = electricityRateHooks.useCreate();

  const rates = useMemo<RateRow[]>(
    () => (list.data?.results ?? []).map((r) => ({ id: r.id, value: r.rate, effective_from: r.effective_from })),
    [list.data],
  );

  function add(value: string, effective_from: string) {
    create.mutate(
      { rate: value, effective_from },
      {
        onSuccess: () => toast.success('Electricity rate added'),
        onError: (e) => toast.error('Could not add rate', toApiError(e).message),
      },
    );
  }

  return (
    <RatePanel
      title="Electricity rate"
      unitLabel="per unit"
      valueLabel="Rate per unit"
      rates={rates}
      isLoading={list.isPending}
      adding={create.isPending}
      onAdd={add}
    />
  );
}
