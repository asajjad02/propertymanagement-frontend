'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { apartmentTypeHooks } from '@/hooks/resources';
import { money } from '@/lib/format';
import type { ApartmentType } from '@/types/api';

import { ApartmentTypeActions } from './apartment-type-actions';
import { ApartmentTypeFormDialog } from './apartment-type-form-dialog';

/** Manage apartment types and their monthly maintenance rates. */
export function ApartmentTypesSection() {
  const { data, isPending } = apartmentTypeHooks.useList();
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => data?.results ?? [], [data]);

  const columns = useMemo<ColumnDef<ApartmentType, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Type',
        accessorFn: (t) => t.name,
        cell: (c) => <span className="font-medium text-ink">{c.getValue<string>()}</span>,
      },
      {
        id: 'maintenance_charge',
        header: 'Maintenance / mo',
        accessorFn: (t) => t.maintenance_charge,
        cell: (c) => <span className="font-mono tabular-nums">{money(c.getValue<string>())}</span>,
        meta: { align: 'right' },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (t) => t.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => <ApartmentTypeActions type={c.row.original} />,
        meta: { align: 'right' },
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Apartment types</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Each type carries a monthly maintenance charge — a flat&apos;s maintenance on its
            combined monthly bill comes from its type.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add type
        </Button>
      </CardHeader>
      <CardBody className="pt-0">
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isPending}
          ariaLabel="Apartment types"
          emptyTitle="No apartment types yet"
          emptyDescription="Add your first type (e.g. Studio, 2-Bed) and its maintenance rate."
        />
      </CardBody>
      <ApartmentTypeFormDialog open={adding} onOpenChange={setAdding} />
    </Card>
  );
}
