import { Phone } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Person } from '@/types/api';

export interface PersonSummaryCardProps {
  title: string;
  person: Person | null;
  /** Badge shown in the header when a person is present (e.g. a TypeTag). */
  badge?: React.ReactNode;
  /** Header action (e.g. a "Change" button), shown when a person is present. */
  action?: React.ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  /** Action rendered inside the empty state (e.g. "Assign owner"). */
  emptyAction?: React.ReactNode;
}

/** Compact person card linking to their profile. Used for owner/resident slots. */
export function PersonSummaryCard({
  title,
  person,
  badge,
  action,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: PersonSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {person ? (
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardBody>
        {person ? (
          <Link href={`/residents/${person.id}`} className="flex items-center gap-3 group">
            <Avatar name={person.full_name} />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink group-hover:text-primary-text transition-colors">
                {person.full_name}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Phone className="h-3.5 w-3.5" />
                {person.phone || '—'}
              </p>
            </div>
          </Link>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} className="py-6" />
        )}
      </CardBody>
    </Card>
  );
}
