import { Car } from 'lucide-react';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Vehicle } from '@/types/api';

/** Read-only list of vehicles. Shared by flat detail and resident profile. */
export function VehicleList({ vehicles, title = 'Vehicles' }: { vehicles: Vehicle[]; title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="label-mono">{vehicles.length}</span>
      </CardHeader>
      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles" className="py-8" />
      ) : (
        <ul className="divide-y divide-hairline">
          {vehicles.map((v) => (
            <li key={v.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <Car className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">{v.registration_number || 'Unregistered'}</p>
                  <p className="text-xs capitalize text-muted">
                    {v.vehicle_type}
                    {v.color && ` · ${v.color}`}
                  </p>
                </div>
              </div>
              {v.parking_slot_number && (
                <span className="font-mono text-xs text-muted">Slot {v.parking_slot_number}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
