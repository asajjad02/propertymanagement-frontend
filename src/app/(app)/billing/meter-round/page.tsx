'use client';

import { ArrowLeft, Check, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { MeterPhotoField } from '@/components/billing/meter-photo-field';
import { FlatFormDialog } from '@/components/flats/flat-form-dialog';
import { PrintRoundButton } from '@/components/billing/print-round-button';
import { PageChrome } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { electricityBillHooks, meterHooks, useEnterBillReading } from '@/hooks/resources';
import { currentMonthKey, useBillingRound, type MonthKey, type RoundStop } from '@/hooks/use-billing-round';
import { cn } from '@/lib/cn';
import { billingPeriodFor } from '@/lib/billing-period';
import { toApiError } from '@/lib/errors';
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

  // Stops that would have to invent a baseline before they can be billed — the
  // same test MeterRow makes per row, counted here to offer the bulk screen.
  // Includes drafts anchored at zero: those would bill from nothing too.
  const needBaseline = stops.filter(
    (s) =>
      Number(s.previousReading) === 0 &&
      (!s.bill || (s.bill.status === 'draft' && Number(s.bill.previous_reading) === 0)),
  ).length;

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
            description="The round covers every flat that has a meter. Add flats, or their meters, to see them here."
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

          {/*
           * On a first month, most flats have no starting figure and each row
           * would ask for one mid-walk. Offer the bulk screen up front instead —
           * opening readings get copied off a sheet at a desk, not in a stairwell.
           */}
          {needBaseline > 0 && (
            <Link
              href="/billing/opening-readings"
              className="flex items-center justify-between gap-3 rounded-card border border-hairline bg-raised px-4 py-3 hover:border-line"
            >
              <p className="text-sm text-ink">
                <span className="font-medium tabular-nums">
                  {needBaseline} {needBaseline === 1 ? 'flat' : 'flats'}
                </span>
                <span className="text-muted">
                  {needBaseline === 1 ? ' has no' : ' have no'} previous reading yet
                </span>
              </p>
              <span className="shrink-0 text-xs font-medium text-primary">
                {needBaseline === 1 ? 'Set it' : 'Set them all'} →
              </span>
            </Link>
          )}

          {/*
           * Offered once anything has been read, not only at 100%: a round often
           * gets walked over two evenings, and the bills issued on the first are
           * printable straight away.
           */}
          {done > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-card border border-hairline bg-raised px-4 py-3">
              <p className="text-sm text-muted">
                <span className="font-medium tabular-nums text-ink">{done}</span> issued this month
              </p>
              <PrintRoundButton month={month} className="h-9 shrink-0 px-3 text-xs" />
            </div>
          )}

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
  const patchMeter = meterHooks.usePatch();
  const deleteBill = electricityBillHooks.useDelete();
  const [reading, setReading] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const { flatNumber } = stop;
  const working =
    createBill.isPending || enterReading.isPending || patchMeter.isPending || deleteBill.isPending;

  /*
   * A meter that has never been read sits at 0, but the dial on the wall
   * doesn't. Billing `current - 0` would charge the resident for the meter's
   * entire lifetime, so the first time round a flat we ask what it currently
   * reads and use that as the baseline.
   *
   * A draft that was created before anyone set a baseline is anchored at 0 too,
   * and its `previous_reading` is server-owned and read-only — so it can't be
   * corrected in place, only replaced. Ask for the baseline here as well rather
   * than let the round quietly bill from zero.
   */
  const draftAnchoredAtZero =
    stop.bill?.status === 'draft' && Number(stop.bill.previous_reading) === 0;
  const needsBaseline =
    Number(stop.previousReading) === 0 && (!stop.bill || draftAnchoredAtZero);
  const [baseline, setBaseline] = useState('');
  const [editingFlat, setEditingFlat] = useState(false);
  const effectivePrevious = needsBaseline && baseline ? baseline : stop.previousReading;

  /*
   * The photo is the evidence for the reading, so it's required, not optional —
   * a bill issued without one can't be defended if a resident disputes it. It
   * rides along in the enter_reading request; the server commits the reading,
   * the issue, and the photo together (or none), so there's nothing to clean up
   * on failure.
   */
  async function issue() {
    if (!reading || !photo) return;

    // A stop without a bill gets one now, for the month being walked. This is
    // what lets the round cover every flat instead of only the ones someone had
    // already prepared a bill for.
    let billId = stop.bill?.id;

    // Replace a draft that's anchored at zero once we know the real baseline. A
    // draft holds nothing but the flat and the period, so recreating it against
    // the corrected meter loses no work — and it's the only way to move a
    // `previous_reading` the server owns.
    if (billId !== undefined && draftAnchoredAtZero && baseline) {
      try {
        await deleteBill.mutateAsync(billId);
        billId = undefined;
      } catch (err) {
        toast.error('Could not set the starting reading', `${flatNumber}: ${toApiError(err).message}`);
        return;
      }
    }

    if (billId === undefined) {
      const [y, m] = month.split('-').map(Number);
      const period = billingPeriodFor(new Date(y, m - 1, 1));
      try {
        // The bill derives `previous_reading` from the meter's running value, so
        // a first-time baseline is written to the meter rather than sent with
        // the bill. One source of truth: two clients creating bills at once
        // can't anchor to different baselines.
        if (needsBaseline && baseline) {
          await patchMeter.mutateAsync({
            id: stop.meterId,
            payload: { current_reading: baseline, previous_reading: baseline },
          });
        }
        const created = await createBill.mutateAsync({
          flat: stop.flatId,
          billing_period_start: period.start,
          billing_period_end: period.end,
        });
        billId = created.id;
      } catch {
        toast.error('Could not start this bill', `${flatNumber}: creating the bill for this month failed.`);
        return;
      }
    }

    /*
     * Reading and photo go up together: the server stores the reading, issues
     * the bill and records the photo in one transaction, so a failed upload
     * rolls the issue back with it. This used to be two calls, which could leave
     * a live bill behind with no evidence attached — and, once the endpoint went
     * multipart-only, failed outright.
     */
    try {
      // Reading + photo go together; the server issues the bill and stores the
      // photo in one transaction, so there's no "issued but no photo" state.
      await enterReading.mutateAsync({
        id: billId,
        payload: { current_reading: reading, reading_date: TODAY, photo },
      });
    } catch (err) {
      // The server's own reason where it has one — "no apartment type", say — is
      // more use than a guess about the reading. `effectivePrevious` accounts for
      // a baseline just entered, which stop.previousReading wouldn't.
      toast.error(
        'Could not issue bill',
        toApiError(err).message || `${flatNumber}: check the reading is above ${numeric(effectivePrevious)}.`,
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
        {needsBaseline ? (
          <span className="label-mono text-warn">First reading</span>
        ) : (
          <span className="label-mono">Prev {numeric(stop.previousReading)}</span>
        )}
      </div>

      {/* No history for this meter yet — ask what it reads now so the first
          bill charges the month, not the meter's whole life. */}
      {needsBaseline && !stop.blocked && (
        <div className="mt-2.5">
          <Input
            type="number"
            inputMode="decimal"
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            placeholder="Previous reading (start point)"
            className="h-12 w-full tabular-nums"
            aria-label={`${flatNumber} previous reading`}
          />
          <p className="mt-1 text-xs text-muted">
            This meter has no history. Enter what it read at the start of the period — leave 0 only
            if it is genuinely a new meter.
          </p>
        </div>
      )}

      {/*
       * Say it before the walk, not after the photo: a blocked stop can't be
       * issued no matter what's typed, so the inputs would only waste the trip.
       */}
      {stop.blocked ? (
        <div className="mt-2 flex items-start gap-2 rounded-control bg-warn-soft px-3 py-2">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
          <p className="text-xs text-ink-secondary">
            {stop.blocked}{' '}
            {/*
              * Fixed here, in a dialog, rather than by navigating away: leaving
              * the round means losing your place in it, and the reading you were
              * about to take. A missing rate is the exception — that's a
              * building-wide setting, not something this flat can answer for.
              */}
            {stop.blockedKind === 'apartment_type' ? (
              <button
                type="button"
                onClick={() => setEditingFlat(true)}
                className="font-medium text-primary underline"
              >
                Set the apartment type
              </button>
            ) : (
              <Link href="/rates" className="font-medium text-primary underline">
                Configure the rate
              </Link>
            )}
          </p>
        </div>
      ) : (
      <>
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
        {/* Camera or library, then framed and re-encoded before it's held —
            see MeterPhotoField for why that isn't just cosmetic. */}
        <MeterPhotoField value={photo} onChange={setPhoto} compact />
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
      </>
      )}

      {/* The round refetches on save: flat mutations invalidate the whole `flats`
          key, which is what the round's lookup reads from. */}
      <FlatFormDialog flat={stop.flat} open={editingFlat} onOpenChange={setEditingFlat} />
    </li>
  );
}
