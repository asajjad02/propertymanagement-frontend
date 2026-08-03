'use client';

import { ArrowLeft, Check, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
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
 * Opening readings — set each meter's starting point, for many flats at once.
 *
 * A new meter in the system sits at 0, but the dial on the wall doesn't. Billing
 * `current - 0` would charge a resident for the meter's whole lifetime, so every
 * flat needs a real starting figure recorded once. Doing that flat-by-flat is
 * fifty round trips through the flat detail screen on your first month, which is
 * why this screen exists: one list, one number per row, one save.
 *
 * The number asked for is the *last reading on record*, typically last month's —
 * not today's. Today's would make the first bill cover nothing, because the month
 * just gone would fall below the baseline instead of being billed. This is also
 * why history isn't entered as bills: the only thing needed to start billing
 * correctly is the number the next bill counts up from.
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

  /*
   * Sixty-three numbers get copied off a sheet, so the hands shouldn't have to
   * leave the keypad between them: Enter and the arrows walk the column. Without
   * it every row costs a tap to focus, which is where a job like this stops being
   * worth doing in one sitting.
   */
  const inputs = useRef<Map<number, HTMLInputElement>>(new Map());

  function focusRow(index: number) {
    // `visible` straight from render — this handler is rebuilt each render, so it
    // can't go stale, and mirroring it into a ref would be an update during render.
    const target = visible[index];
    if (!target) return;
    const el = inputs.current.get(target.meterId);
    el?.focus();
    el?.select();
  }

  function onFieldKey(e: React.KeyboardEvent, index: number) {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusRow(index + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusRow(index - 1);
    }
  }

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
        Enter the last reading you have on record for each flat — usually last month&apos;s. This
        month&apos;s bill counts up from it, so it only needs setting once per flat. Blank rows are
        left untouched.
      </p>

      <Card>
        {/*
          * Stacked on a phone, one row from `md`. Sharing a 390px line left the
          * search field about 180px wide, which is not enough to search in — the
          * height saving here comes from the padding, not from crowding.
          */}
        <div className="flex flex-col gap-2 border-b border-hairline px-3 py-2 md:flex-row md:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Find a flat" className="md:flex-1" />
          <Segmented
            value={unsetOnly ? 'pending' : 'all'}
            onValueChange={(v) => setUnsetOnly(v === 'pending')}
            options={[
              { value: 'pending', label: 'To do' },
              { value: 'all', label: 'All' },
            ]}
            className="md:w-auto md:shrink-0"
          />
        </div>

        {/* Names the column, so a bare number field isn't left to be guessed at. */}
        {!loading && visible.length > 0 && (
          <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5">
            <span className="label-mono">Flat</span>
            <span className="label-mono pr-3">Last reading</span>
          </div>
        )}

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
                ? 'Nothing to set up — every flat has a reading for the next bill to count up from.'
                : 'Try a different flat number.'
            }
          />
        ) : (
          <ul className="divide-y divide-hairline">
            {visible.map((row, i) => {
              const typed = (values[row.meterId] ?? '').trim() !== '';
              return (
                <li
                  key={row.meterId}
                  className={cn(
                    'flex items-center gap-3 px-3 py-1.5',
                    skipped.has(row.meterId) && 'bg-warn-soft',
                    // A filled row recedes: what's left to do should be what stands out.
                    typed && 'bg-ok-soft/40',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.flatNumber}</p>
                    {row.isSet && !typed && (
                      <p className="label-mono mt-0.5 normal-case tracking-normal">
                        on file {row.current}
                      </p>
                    )}
                    {skipped.has(row.meterId) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-warn">
                        <TriangleAlert className="h-3 w-3" />
                        Already billed — delete the bill to re-read it
                      </p>
                    )}
                  </div>
                  <Input
                    ref={(el) => {
                      if (el) inputs.current.set(row.meterId, el);
                      else inputs.current.delete(row.meterId);
                    }}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    // Mono and right-aligned, per the house rule for readings — it
                    // also makes a mistyped digit count visible at a glance.
                    className="h-10 w-28 font-mono text-right tabular-nums md:h-9"
                    aria-label={`Last reading for flat ${row.flatNumber}`}
                    // Not '0': a zero placeholder reads as a real value, and zero is
                    // the one answer that would bill a meter's whole lifetime.
                    placeholder={row.isSet ? row.current : '—'}
                    enterKeyHint={i === visible.length - 1 ? 'done' : 'next'}
                    value={values[row.meterId] ?? ''}
                    onKeyDown={(e) => onFieldKey(e, i)}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [row.meterId]: e.target.value }))
                    }
                  />
                  {typed ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-ok" />
                  ) : (
                    <span className="w-3.5 shrink-0" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/*
       * Sticky rather than at the end of the list: with fifty rows the button
       * would be a long scroll away from the row you just filled in, and you
       * want to see the running count as you type.
       */}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper px-4 py-2.5 pb-safe md:mx-0 md:rounded-card md:border">
        {/* Progress against the whole job, not just the unsaved part: "12 of 63"
            is the number that tells you whether to keep going or stop for now. */}
        {pendingCount > 0 && (
          <div className="mb-2 h-1 overflow-hidden rounded-pill bg-raised">
            <div
              className="h-full rounded-pill bg-primary transition-[width] duration-300"
              style={{ width: `${Math.round((edits.length / pendingCount) * 100)}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {edits.length > 0 ? (
              <>
                <span className="font-medium tabular-nums text-ink">{edits.length}</span> of{' '}
                <span className="tabular-nums">{pendingCount}</span> entered
              </>
            ) : (
              `${pendingCount} ${pendingCount === 1 ? 'flat needs' : 'flats need'} a reading`
            )}
          </p>
          <Button loading={saving} disabled={saving || edits.length === 0} onClick={save}>
            Save {edits.length > 0 ? edits.length : ''} {edits.length === 1 ? 'reading' : 'readings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
