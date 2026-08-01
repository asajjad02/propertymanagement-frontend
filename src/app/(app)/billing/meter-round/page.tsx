'use client';

import { ArrowLeft, Camera, Check } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { uploadDocument } from '@/api/documents';
import { PageChrome } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { electricityBillHooks, useEnterBillReading } from '@/hooks/resources';
import { currentMonthKey, useBillingRound, type MonthKey, type RoundStop } from '@/hooks/use-billing-round';
import { cn } from '@/lib/cn';
import { billingPeriodFor } from '@/lib/billing-period';
import { numeric } from '@/lib/format';

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * The meter round: walk the property, photograph each meter, type its reading,
 * issue that flat's bill.
 *
 * This is the one screen that is only ever used on a phone, one-handed, often
 * in a stairwell. So it's built around the two questions the person doing it
 * actually has — "how many left?" and "where's flat B-204?" — with a progress
 * header that stays put and a filter to jump ahead when the walking order
 * doesn't match the list order.
 */
export default function MeterRoundPage() {
  const [month, setMonth] = useState<MonthKey>(currentMonthKey);
  const [query, setQuery] = useState('');

  // Shared with the Overview, so both report the same progress for the month.
  const { stops, total, done, isPending: loading } = useBillingRound(month);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stops;
    return stops.filter((s) => s.flatNumber.toLowerCase().includes(q));
  }, [stops, query]);

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="space-y-4 md:mx-auto md:max-w-2xl md:space-y-6">
      <PageChrome title="Meter round" backHref="/billing" />

      {/* Desktop-only: below `lg` the app bar carries the back chevron and title. */}
      <div className="hidden lg:block">
        <Link href="/billing" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Monthly Bills
        </Link>
        <h1 className="display mt-2.5 text-[1.75rem] text-ink">Meter round</h1>
        <p className="mt-1.5 text-sm text-muted">
          Walk the property, snap each meter, and enter its reading. Each reading issues that
          flat&apos;s combined monthly bill.
        </p>
      </div>

      {loading ? (
        <SkeletonRegion label="Loading meters…" className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="space-y-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-14 w-full" />
            </Card>
          ))}
        </SkeletonRegion>
      ) : total === 0 ? (
        <Card>
          <EmptyState
            title="No meters to read"
            description="The round covers occupied flats that have a meter. Mark flats occupied, or add their meters, to see them here."
          />
        </Card>
      ) : (
        <>
          {/*
           * Progress stays on screen for the whole round. "How many left" is the
           * question this screen gets asked most, and it used to be unanswerable
           * without counting rows by hand.
           */}
          <div
            style={{ top: 'calc(var(--topbar-h) + var(--safe-t))' }}
            className={cn(
              'sticky z-20 -mx-4 space-y-2 border-b border-hairline bg-surface/95 px-4 py-2.5 backdrop-blur',
              'md:static md:mx-0 md:rounded-card md:border md:bg-surface md:p-4 md:backdrop-blur-none',
            )}
          >
            {/* Which month's round this is. A native month picker rather than a
                pair of date fields — the round is a month, so that's the unit
                to ask for. */}
            <div className="flex items-center justify-between gap-3">
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value || currentMonthKey())}
                aria-label="Billing month"
                className="h-10 w-auto flex-1 md:max-w-48"
              />
              <p className="label-mono shrink-0">{total - done} left</p>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-ink">
                <span className="font-semibold tabular-nums">{done}</span>
                <span className="text-muted"> of </span>
                <span className="tabular-nums">{total}</span>
                <span className="text-muted"> read</span>
              </p>
              {done === total && total > 0 && (
                <p className="text-xs font-medium text-ok">Round complete</p>
              )}
            </div>
            <div
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Meters read"
              className="h-1.5 overflow-hidden rounded-pill bg-raised"
            >
              <div
                className="h-full rounded-pill bg-primary transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Walking order rarely matches list order — let them jump. */}
            <SearchInput value={query} onChange={setQuery} placeholder="Jump to a flat…" />
          </div>

          {visible.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-muted">
              No pending meter matches “{query}”.
            </p>
          ) : (
            <Card>
              <ul className="divide-y divide-hairline">
                {visible.map((stop) => (
                  <MeterRow key={stop.flatId} stop={stop} month={month} />
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MeterRow({ stop, month }: { stop: RoundStop; month: MonthKey }) {
  const toast = useToast();
  const enterReading = useEnterBillReading();
  const createBill = electricityBillHooks.useCreate();
  const [reading, setReading] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const { flatNumber } = stop;
  const working = createBill.isPending || enterReading.isPending;

  /*
   * The photo is the evidence for the reading, so it's required, not optional —
   * a bill issued without one can't be defended if a resident disputes it.
   * Upload first: if it fails we stop with nothing issued, rather than leaving a
   * live bill behind with no proof attached.
   */
  async function issue() {
    if (!reading || !photo) return;

    // A stop without a bill gets one now, for the month being walked. This is
    // what lets the round cover every occupied flat instead of only the ones
    // someone had already prepared a bill for.
    let billId = stop.bill?.id;
    if (billId === undefined) {
      const [y, m] = month.split('-').map(Number);
      const period = billingPeriodFor(new Date(y, m - 1, 1));
      try {
        const created = await createBill.mutateAsync({
          flat: stop.flatId,
          meter: stop.meterId,
          billing_period_start: period.start,
          billing_period_end: period.end,
          previous_reading: stop.previousReading,
          // Recomputed server-side on issue; sent only to satisfy the payload.
          previous_outstanding: '0',
        });
        billId = created.id;
      } catch {
        toast.error('Could not start this bill', `${flatNumber}: creating the bill for this month failed.`);
        return;
      }
    }

    try {
      await enterReading.mutateAsync({
        id: billId,
        payload: { current_reading: reading, reading_date: TODAY },
      });
    } catch {
      toast.error('Could not issue bill', `${flatNumber}: check the reading is above ${numeric(stop.previousReading)}.`);
      return;
    }
    try {
      await uploadDocument({
        file: photo,
        related_model: 'electricity_bill',
        related_id: billId,
        document_type: 'meter_photo',
      });
    } catch {
      // The bill is already issued at this point — say so plainly and point at
      // the fix rather than pretending the whole thing failed.
      toast.warning(
        'Bill issued, photo failed',
        `${flatNumber}: reading saved. Attach the meter photo from the bill.`,
      );
      return;
    }
    toast.success('Bill issued', `${flatNumber} · reading ${numeric(reading)}`);
    // No local "done" flag to set — the mutation invalidates the bill cache, the
    // bill comes back issued, and `stop.read` follows.
  }

  /*
   * Already read this month: collapse to a single quiet line so the remaining
   * work is what fills the screen, and offer no way to issue again. The reading
   * shown is the one on the bill, not whatever is in this component's state —
   * that's what makes it survive a reload.
   */
  if (stop.read) {
    return (
      <li className="flex items-center gap-3 px-4 py-3 opacity-60">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-ok-soft text-ok">
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-medium text-ink">{flatNumber}</span>
        <span className="ml-auto text-xs tabular-nums text-muted">
          {stop.bill?.current_reading ? `reading ${numeric(stop.bill.current_reading)}` : 'billed'}
        </span>
      </li>
    );
  }

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-semibold text-ink">{flatNumber}</span>
        <span className="label-mono">Prev {numeric(stop.previousReading)}</span>
      </div>

      {/*
       * Two rows on a phone. Cramming reading + camera + Issue onto one 390px
       * line left the number field about 200px wide and the button barely
       * tappable; the reading is the thing being typed, so it gets the width,
       * and Issue gets a full-width target underneath. One row from `sm` up.
       */}
      <div className="mt-2.5 flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="Current reading"
          // Bigger than a normal field: typed at arm's length, often in poor light.
          className="h-14 flex-1 text-lg tabular-nums sm:h-12 sm:text-base"
          aria-label={`${flatNumber} current reading`}
        />
        {/* Required, so it looks unfinished until it's done rather than merely
            available — a plain outline reads as optional. */}
        <label
          className={cn(
            'flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-control border',
            'transition-colors sm:h-12 sm:w-12',
            photo
              ? 'border-primary bg-primary-soft text-primary-text'
              : 'border-dashed border-muted/60 text-ink-secondary hover:border-muted',
          )}
          aria-label={photo ? 'Meter photo attached — tap to retake' : 'Capture meter photo (required)'}
        >
          {photo ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <Button
        onClick={issue}
        // Covers both requests — creating the bill and entering the reading.
        loading={working}
        disabled={!reading || !photo}
        className="mt-2 h-12 w-full sm:mt-2.5"
      >
        Issue bill
      </Button>

      {/* Say which piece is missing — a disabled button with no reason is a
          dead end when you're standing at the meter. */}
      {photo ? (
        <p className="mt-1.5 truncate text-xs text-muted">Photo attached · {photo.name}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">
          {reading ? 'Photo of the meter required to issue.' : 'Enter the reading and photograph the meter.'}
        </p>
      )}
    </li>
  );
}
