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
  // Meters the server declined to touch: they already anchor an issued bill.
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
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

  /*
   * One request for the whole set, not a PATCH per flat. The server applies them
   * in a single transaction, so the outcome is "all of them" or "none of them" —
   * never a half-set that leaves some flats billing from zero with no way to tell
   * which. Meters that already have an issued bill come back in `skipped`; those
   * readings anchor a bill that exists, so they're reported rather than replaced.
   */
  async function save() {
    setSaving(true);
    setSkipped(new Set());
    try {
      const result = await api.setOpeningReadings(
        edits.map(([id, value]) => ({ meter: Number(id), current_reading: value.trim() })),
      );
      await qc.invalidateQueries({ queryKey: meterHooks.keys.all });

      const refused = new Set(result.skipped.map((s) => s.meter));
      setSkipped(refused);
      // Clear only what landed, so the rows still needing attention keep their
      // typed value instead of having to be entered again.
      setValues((prev) => {
        const next: Record<number, string> = {};
        for (const id of refused) next[id] = prev[Number(id)];
        return next;
      });

      if (result.skipped.length === 0) {
        toast.success(
          `${result.updated} opening ${result.updated === 1 ? 'reading' : 'readings'} saved`,
        );
      } else {
        toast.warning(
          `${result.updated} saved, ${result.skipped.length} left alone`,
          `${result.skipped
            .slice(0, 3)
            .map((s) => s.flat_number)
            .join(', ')}${result.skipped.length > 3 ? ` and ${result.skipped.length - 3} more` : ''} ` +
            'already have an issued bill. Delete it to re-read that flat.',
        );
      }
    } catch (err) {
      toast.error('Nothing was saved', toApiError(err).message);
    } finally {
      setSaving(false);
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
                  skipped.has(row.meterId) && 'bg-warn-soft',
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
                  {skipped.has(row.meterId) && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-warn">
                      <TriangleAlert className="h-3 w-3" />
                      Already billed — delete the bill to re-read this flat
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
