'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  flats: 'Flats',
  residents: 'Residents',
  visitors: 'Visitors',
  billing: 'Monthly Bills',
  'meter-round': 'Meter round',
  maintenance: 'Maintenance',
  staff: 'Staff',
  expenses: 'Expenses',
  complaints: 'Complaints',
  reports: 'Reports',
  team: 'Team',
  rates: 'Rates',
  settings: 'Settings',
};

function labelFor(segment: string): string {
  if (/^\d+$/.test(segment)) return `#${segment}`;
  if (LABELS[segment]) return LABELS[segment];
  // Humanize any unmapped segment so it never shows raw-lowercase.
  return segment.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Breadcrumb derived from the current path. Numeric ids render as "#id". */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted">
      {segments.map((segment, i) => {
        const href = `/${segments.slice(0, i + 1).join('/')}`;
        const isLast = i === segments.length - 1;
        return (
          <Fragment key={href}>
            {i > 0 && <span className="text-faint">/</span>}
            {isLast ? (
              <span className="text-ink font-medium">{labelFor(segment)}</span>
            ) : (
              <Link href={href} className="hover:text-ink transition-colors">
                {labelFor(segment)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
