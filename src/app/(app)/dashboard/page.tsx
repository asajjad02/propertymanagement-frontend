'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  ChevronRight,
  DoorOpen,
  Gauge,
  MessageSquare,
  ReceiptText,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { fetchDashboardSummary } from '@/api/endpoints';
import { PageChrome } from '@/components/shell/page-chrome';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { currentMonthKey, useBillingRound, useOutstanding } from '@/hooks/use-billing-round';
import { cn } from '@/lib/cn';
import { money } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

import type { DashboardSummary } from '@/types/dashboard';

type SetupKey = keyof DashboardSummary['setup'];
const SETUP_STEPS: { key: SetupKey; label: string; href: string; cta: string }[] = [
  { key: 'has_flats', label: 'Add flats', href: '/flats', cta: 'Flats' },
  { key: 'has_rates', label: 'Set electricity rate & apartment types', href: '/configuration', cta: 'Configure' },
  { key: 'has_team', label: 'Invite your team', href: '/team', cta: 'Team' },
];

/**
 * Overview.
 *
 * Answers "what needs me today?", in priority order — money owed, then a list
 * of things to act on, then ambient status. It used to be a grid of four
 * read-only tiles (occupancy %, vacant, complaints, visitors) followed by three
 * links that duplicated the nav; nothing on it was a task, and the number a
 * property manager checks first — what's owed — wasn't there at all.
 *
 * Every row in "Needs you" is a live count that links to the screen that
 * resolves it, and disappears when it hits zero. An empty list is the point.
 */
export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const { data, isPending } = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: fetchDashboardSummary });

  const month = currentMonthKey();
  const round = useBillingRound(month);
  const outstanding = useOutstanding();

  const loading = isPending || round.isPending || outstanding.isPending;

  const openComplaints = data ? data.complaints.open + data.complaints.in_progress : 0;
  const vacant = data?.flats.vacant ?? 0;
  const setupDone = data ? Object.values(data.setup).every(Boolean) : true;
  const showChecklist = hasRole('admin') && data && !setupDone;

  // Only what's actually outstanding shows up here.
  const tasks: TaskRow[] = [];
  if (round.remaining > 0) {
    tasks.push({
      icon: Gauge,
      href: '/billing/meter-round',
      label: `${round.remaining} ${round.remaining === 1 ? 'meter' : 'meters'} still to read`,
      detail: `${round.done} of ${round.total} done this month`,
      tone: 'amber',
    });
  }
  if (outstanding.billCount > 0) {
    tasks.push({
      icon: ReceiptText,
      href: '/billing?status=issued',
      label: `${outstanding.billCount} unpaid ${outstanding.billCount === 1 ? 'bill' : 'bills'}`,
      detail: 'awaiting payment',
      tone: 'amber',
    });
  }
  if (openComplaints > 0) {
    tasks.push({
      icon: MessageSquare,
      href: '/complaints',
      label: `${openComplaints} open ${openComplaints === 1 ? 'complaint' : 'complaints'}`,
      detail: `${data?.complaints.open ?? 0} new · ${data?.complaints.in_progress ?? 0} in progress`,
      tone: 'amber',
    });
  }
  if (vacant > 0) {
    tasks.push({
      icon: DoorOpen,
      href: '/flats?occupancy_status=vacant',
      label: `${vacant} vacant ${vacant === 1 ? 'flat' : 'flats'}`,
      detail: 'not earning',
      tone: 'neutral',
    });
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageChrome title="Overview" />
      <PageHeader
        title={`Welcome back${user ? `, ${user.username}` : ''}`}
        subtitle="What needs your attention today."
      />

      {loading ? (
        <SkeletonRegion label="Loading overview…" className="space-y-4">
          <Card>
            <CardBody className="space-y-2">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-9 w-40" />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-5 w-2/3" />
              ))}
            </CardBody>
          </Card>
        </SkeletonRegion>
      ) : (
        <>
          {/*
           * The money first. For a property business "how much is owed" is the
           * question the screen exists to answer, and it wasn't on here at all.
           */}
          <Card>
            <Link href="/billing?status=issued" className="block transition-colors active:bg-raised">
              <CardBody className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-mono">Outstanding</p>
                  <p
                    className={cn(
                      'display mt-1 text-3xl tabular-nums',
                      outstanding.amount > 0 ? 'text-danger' : 'text-ok',
                    )}
                  >
                    {money(outstanding.amount)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {outstanding.billCount > 0
                      ? `across ${outstanding.billCount} unpaid ${outstanding.billCount === 1 ? 'bill' : 'bills'}`
                      : 'everything settled'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-faint" aria-hidden />
              </CardBody>
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs you</CardTitle>
              {tasks.length > 0 && <span className="label-mono">{tasks.length}</span>}
            </CardHeader>
            {tasks.length === 0 ? (
              <CardBody className="flex items-center gap-2.5 text-sm text-muted">
                <span className="flex h-5 w-5 items-center justify-center rounded-pill bg-ok-soft text-ok">
                  <Check className="h-3 w-3" />
                </span>
                You&apos;re all caught up.
              </CardBody>
            ) : (
              <ul className="divide-y divide-hairline">
                {tasks.map((task) => (
                  <Task key={task.href} {...task} />
                ))}
              </ul>
            )}
          </Card>

          {showChecklist && (
            <Card>
              <CardHeader><CardTitle>Finish setting up</CardTitle></CardHeader>
              <ul className="divide-y divide-hairline">
                {SETUP_STEPS.map((step) => {
                  const done = !!data?.setup[step.key];
                  return (
                    <li key={step.key} className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                      <span className="flex items-center gap-2.5 text-sm">
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-pill',
                            done ? 'bg-ok-soft text-ok' : 'border border-hairline text-faint',
                          )}
                        >
                          {done && <Check className="h-3 w-3" />}
                        </span>
                        <span className={done ? 'text-muted line-through' : 'text-ink'}>{step.label}</span>
                      </span>
                      {!done && (
                        <Link
                          href={step.href}
                          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-text"
                        >
                          {step.cta} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* Ambient status: worth knowing, nothing to do about it. Last, and quiet. */}
          <Card>
            <CardHeader><CardTitle>Right now</CardTitle></CardHeader>
            <dl className="divide-y divide-hairline">
              <Stat
                label="Occupancy"
                value={`${data?.flats.occupancy_rate ?? 0}%`}
                detail={`${data?.flats.occupied ?? 0} of ${data?.flats.total ?? 0} flats`}
              />
              <Stat
                label="On site"
                value={String(data?.visitors_inside ?? 0)}
                detail="visitors inside"
                icon={UserCheck}
              />
              <Stat label="Residents" value={String(data?.residents ?? 0)} detail="owners & tenants" />
            </dl>
          </Card>
        </>
      )}
    </div>
  );
}

interface TaskRow {
  icon: LucideIcon;
  href: string;
  label: string;
  detail: string;
  tone: 'amber' | 'neutral';
}

/** One thing to do, linking to the screen that resolves it. */
function Task({ icon: Icon, href, label, detail, tone }: TaskRow) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-raised md:px-5"
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill',
            tone === 'amber' ? 'bg-warn-soft text-warn' : 'bg-neutral-soft text-muted',
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium text-ink">{label}</span>
          <span className="block truncate text-sm text-muted">{detail}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden />
      </Link>
    </li>
  );
}

function Stat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-5">
      <dt className="flex items-center gap-2 text-sm text-ink-secondary">
        {Icon && <Icon className="h-4 w-4 text-muted" aria-hidden />}
        {label}
      </dt>
      <dd className="text-right">
        <span className="text-sm font-medium tabular-nums text-ink">{value}</span>
        <span className="ml-2 text-xs text-muted">{detail}</span>
      </dd>
    </div>
  );
}
