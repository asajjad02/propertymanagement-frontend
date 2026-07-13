'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

import { fetchDashboardSummary } from '@/api/endpoints';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { LoadingBlock } from '@/components/ui/spinner';
import { useAuth } from '@/providers/auth-provider';

import type { DashboardSummary } from '@/types/dashboard';

type SetupKey = keyof DashboardSummary['setup'];
const SETUP_STEPS: { key: SetupKey; label: string; href: string; cta: string }[] = [
  { key: 'has_building', label: 'Add your building', href: '/flats', cta: 'Buildings' },
  { key: 'has_flats', label: 'Add flats', href: '/flats', cta: 'Flats' },
  { key: 'has_rates', label: 'Set electricity & maintenance rates', href: '/rates', cta: 'Rates' },
  { key: 'has_team', label: 'Invite your team', href: '/team', cta: 'Team' },
];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const { data, isPending } = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: fetchDashboardSummary });

  const openWork = data ? data.complaints.open + data.complaints.in_progress : 0;
  const setupDone = data ? Object.values(data.setup).every(Boolean) : true;
  const showChecklist = hasRole('admin') && data && !setupDone;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${user ? `, ${user.username}` : ''}`}
        subtitle="Your society at a glance — occupancy, people, complaints, and who's on-site."
      />

      {isPending ? (
        <Card><CardBody><LoadingBlock /></CardBody></Card>
      ) : (
        <>
          <StatCardRow>
            <StatCard label="Occupancy" value={`${data?.flats.occupancy_rate ?? 0}%`} tone="green" sub={`${data?.flats.occupied ?? 0} of ${data?.flats.total ?? 0} flats`} />
            <StatCard label="Vacant flats" value={data?.flats.vacant ?? 0} tone="neutral" sub={`${data?.buildings ?? 0} buildings`} />
            <StatCard label="Open complaints" value={openWork} tone={openWork > 0 ? 'amber' : 'green'} sub={`${data?.complaints.open ?? 0} open · ${data?.complaints.in_progress ?? 0} in progress`} />
            <StatCard label="On-site now" value={data?.visitors_inside ?? 0} tone="blue" sub="visitors inside" />
          </StatCardRow>

          {showChecklist && (
            <Card>
              <CardHeader><CardTitle>Finish setting up</CardTitle></CardHeader>
              <CardBody>
                <ul className="divide-y divide-hairline">
                  {SETUP_STEPS.map((step) => {
                    const done = !!data?.setup[step.key];
                    return (
                      <li key={step.key} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="flex items-center gap-2.5 text-sm">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-pill ${done ? 'bg-ok-soft text-ok' : 'border border-hairline text-faint'}`}>
                            {done && <Check className="h-3 w-3" />}
                          </span>
                          <span className={done ? 'text-muted line-through' : 'text-ink'}>{step.label}</span>
                        </span>
                        {!done && (
                          <Link href={step.href} className="inline-flex items-center gap-1 text-sm font-medium text-primary-text hover:underline">
                            {step.cta} <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickLink href="/flats" title="Flats" desc="Units & occupancy" />
            <QuickLink href="/residents" title="Residents" desc="Owners & tenants" />
            <QuickLink href="/complaints" title="Complaints" desc={`${openWork} need attention`} />
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-card border border-hairline bg-surface px-4 py-3 transition-colors hover:border-muted/40"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-faint" />
    </Link>
  );
}
