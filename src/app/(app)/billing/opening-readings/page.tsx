'use client';

import { ArrowLeft, Check, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import * as api from '@/api/endpoints';
import { PageChrome } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { flatHooks, meterHooks } from '@/hooks/resources';
import { cn } from '@/lib/cn';
import { toApiError } from '@/lib/errors';

/** How many PATCHes are in flight at once — enough to be quick, few enough
 *  that fifty flats don't arrive as fifty simultaneous connections. */
const BATCH = 6;

type Row = { meterId: number; flatNumber: string; current: string; isSet: boolean };

/**
 * Opening readings — set the starting number on many meters at once.
 *
 * A new meter in the system sits at 0, but the dial on the wall doesn't. Billing
 * `current - 0` would charge a resident for the meter's whole lifetime, so every
 * flat needs its real starting figure recorded once. Doing that flat-by-flat is
 * fifty round trips through the flat detail screen on your first month, which is
 * why this screen exists: one list, one number per row, one save.
 *
 * It writes to the meter rather than to a bill on purpose — the meter's running
 * value is what the server derives every future `previous_reading` from, so this
 * is the same field the meter round would have set, just reachable in bulk.
 */
export default function OpeningReadingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const meters = meterHooks.useAll();
  const flats = flatHooks.useAll();

  const [query, setQuery] = useState('');
  const [unsetOnly, setUnsetOnly] = useState(true);
  const [values, setValues] = useState<Record<number, string>>({});
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const loading = meters.isPending || flats.isPending;

  const rows = useMemo<Row[]>(() => {
    const flatById = new Map((flats.data ?? []).map((f) => [f.id, f]));
    return (meters.data ?? [])
      .map((m) => ({
        meterId: m.id,
        flatNumber: flatById.get(m.flat)?.flat_number ?? m.meter_number,
        current: m.current_reading,
        isSet: Number(m.current_reading) > 0,
      }))
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true }));
  }, [meters.data, flats.data]);

  const pendingCount = rows.filter((r) => !r.isSet).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) => (!unsetOnly || !r.isSet) && (!q || r.flatNumber.toLowerCase().includes(q)),
    );
  }, [rows, query, unsetOnly]);

  // Only rows the person actually typed into get written. Everything else is
  // left exactly as it is — this screen never bulk-overwrites live meters.
  const edits = useMemo(
    () => Object.entries(values).filter(([, v]) => v.trim() !== ''),
    [values],
  );

  async function save() {
    setSaving(true);
    setFailed(new Set());
    const errors: { flatNumber: string; message: string }[] = [];
    const stillFailed = new Set<number>();
    const byId = new Map(rows.map((r) => [r.meterId, r]));

    // Batched rather than Promise.all over all fifty, and each failure is caught
    // per row: one bad reading must not throw away the other forty-nine writes.
    for (let i = 0; i < edits.length; i += BATCH) {
      const slice = edits.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async ([id, value]) => {
          const meterId = Number(id);
          try {
            await api.meters.patch(meterId, { current_reading: value.trim() });
          } catch (err) {
            stillFailed.add(meterId);
            errors.push({
              flatNumber: byId.get(meterId)?.flatNumber ?? String(meterId),
              message: toApiError(err).message,
            });
          }
        }),
      );
    }

    await qc.invalidateQueries({ queryKey: meterHooks.keys.all });
    setSaving(false);
    setFailed(stillFailed);

    const saved = edits.length - errors.length;
    // Keep the ones that saved out of the form, so a retry only re-sends the
    // failures instead of rewriting readings that already landed.
    setValues((prev) => {
      const next: Record<number, string> = {};
      for (const id of stillFailed) next[id] = prev[id];
      return next;
    });

    if (errors.length === 0) {
      toast.success(`${saved} opening ${saved === 1 ? 'reading' : 'readings'} saved`);
    } else {
      toast.error(
        `${saved} saved, ${errors.length} failed`,
        `${errors
          .slice(0, 3)
          .map((e) => `${e.flatNumber}: ${e.message}`)
          .join(' · ')}${errors.length > 3 ? ` · and ${errors.length - 3} more` : ''}`,
      );
    }
  }

  return (
    <div className="space-y-4 md:mx-auto md:max-w-2xl md:space-y-6">
      <PageChrome title="Opening readings" backHref="/billing" />

      {/* Desktop-only: below `lg` the app bar carries the back chevron and title. */}
      <div className="hidden lg:block">
        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Monthly Bills
        </Link>
        <h1 className="display mt-2.5 text-[1.75rem] text-ink">Opening readings</h1>
      </div>

      <p className="text-sm text-muted">
        Enter what each meter reads on the wall right now. Future bills count up from this
        number, so it only needs setting once per flat. Blank rows are left untouched.
      </p>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 md:flex-row md:items-center md:justify-between">
          <SearchInput value={query} onChange={setQuery} placeholder="Find a flat" />
          <Segmented
            value={unsetOnly ? 'pending' : 'all'}
            onValueChange={(v) => setUnsetOnly(v === 'pending')}
            options={[
              { value: 'pending', label: 'Needs a reading' },
              { value: 'all', label: 'All flats' },
            ]}
          />
        </div>

        {loading ? (
          <SkeletonRegion label="Loading meters…" className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </SkeletonRegion>
        ) : visible.length === 0 ? (
          <EmptyState
            title={unsetOnly ? 'Every meter has a starting reading' : 'No flats match'}
            description={
              unsetOnly
                ? 'Nothing to set up — the meter round will bill from each meter’s own number.'
                : 'Try a different flat number.'
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((row) => (
              <li
                key={row.meterId}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5',
                  failed.has(row.meterId) && 'bg-danger-soft',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{row.flatNumber}</p>
                  {row.isSet && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Check className="h-3 w-3 text-success" />
                      Reads {row.current}
                    </p>
                  )}
                  {failed.has(row.meterId) && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-danger">
                      <TriangleAlert className="h-3 w-3" />
                      Didn’t save — try again
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="w-32 text-right tabular-nums"
                  aria-label={`Opening reading for flat ${row.flatNumber}`}
                  placeholder={row.isSet ? row.current : '0'}
                  value={values[row.meterId] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [row.meterId]: e.target.value }))
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/*
       * Sticky rather than at the end of the list: with fifty rows the button
       * would be a long scroll away from the row you just filled in, and you
       * want to see the running count as you type.
       */}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper px-4 py-3 pb-safe md:mx-0 md:rounded-card md:border">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {edits.length > 0
              ? `${edits.length} ready to save`
              : `${pendingCount} ${pendingCount === 1 ? 'flat needs' : 'flats need'} a reading`}
          </p>
          <Button loading={saving} disabled={saving || edits.length === 0} onClick={save}>
            Save {edits.length > 0 ? edits.length : ''} {edits.length === 1 ? 'reading' : 'readings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
