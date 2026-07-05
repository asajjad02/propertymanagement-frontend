/**
 * Visitor log rows for a given day. The backend only filters visitors by flat,
 * so date + status + search are applied client-side over the full set. Status
 * is derived: a visitor with an exit_time is "checked out", otherwise "inside".
 */
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';

import type { Visitor } from '@/types/api';

import { visitorHooks } from './resources';
import { useFlatsLookup } from './use-lookups';
import { vehicleHooks } from './resources';

export type VisitorStatus = 'inside' | 'checked out';
export type VisitorFilter = 'all' | 'inside' | 'checked out';

export interface VisitorRow {
  visitor: Visitor;
  flatNumber: string;
  vehicleReg: string | null;
  status: VisitorStatus;
}

function dayOf(visitor: Visitor): string {
  const ref = visitor.entry_time ?? visitor.created_at;
  try {
    return format(parseISO(ref), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export function useVisitorRows(date: string, filter: VisitorFilter, search: string) {
  const visitors = visitorHooks.useAll({ ordering: '-entry_time' });
  const vehicles = vehicleHooks.useAll();
  const flats = useFlatsLookup();

  const forDay = useMemo(() => {
    const vehicleByVisitor = new Map<number, string>();
    for (const v of vehicles.data ?? []) {
      if (v.visitor != null && v.registration_number) vehicleByVisitor.set(v.visitor, v.registration_number);
    }
    return (visitors.data ?? [])
      .filter((v) => dayOf(v) === date)
      .map<VisitorRow>((visitor) => ({
        visitor,
        flatNumber: flats.map.get(visitor.flat)?.flat_number ?? '—',
        vehicleReg: vehicleByVisitor.get(visitor.id) ?? null,
        status: visitor.exit_time ? 'checked out' : 'inside',
      }));
  }, [visitors.data, vehicles.data, flats.map, date]);

  const rows = useMemo(() => {
    const byStatus = filter === 'all' ? forDay : forDay.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (r) =>
        r.visitor.visitor_name.toLowerCase().includes(q) ||
        r.visitor.host_name.toLowerCase().includes(q) ||
        r.visitor.contact_number.includes(q),
    );
  }, [forDay, filter, search]);

  return {
    rows,
    insideCount: forDay.filter((r) => r.status === 'inside').length,
    checkedOutCount: forDay.filter((r) => r.status === 'checked out').length,
    totalCount: forDay.length,
    isLoading: visitors.isPending || flats.isPending,
  };
}
