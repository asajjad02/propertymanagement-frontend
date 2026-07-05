import { Phone } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TypeTag } from '@/components/ui/type-tag';
import type { Person } from '@/types/api';

export interface PersonSummaryCardProps {
  title: string;
  person: Person | null;
  type: 'owner' | 'tenant';
  emptyTitle: string;
  emptyDescription?: string;
}

/** Compact person card (owner or tenant) linking to their profile. */
export function PersonSummaryCard({ title, person, type, emptyTitle, emptyDescription }: PersonSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {person && <TypeTag type={type} />}
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
          <EmptyState title={emptyTitle} description={emptyDescription} className="py-6" />
        )}
      </CardBody>
    </Card>
  );
}
