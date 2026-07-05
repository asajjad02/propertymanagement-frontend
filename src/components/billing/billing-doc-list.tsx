import { FileText } from 'lucide-react';
import Link from 'next/link';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { money } from '@/lib/format';

export interface BillingDocItem {
  id: number;
  title: string;
  subtitle: string;
  amount: string;
  status: string;
  href?: string;
}

/** Compact list of billing documents (bills or charges). Rows link when `href` set. */
export function BillingDocList({
  title,
  items,
  emptyLabel = 'No records',
}: {
  title: string;
  items: BillingDocItem[];
  emptyLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="label-mono">{items.length}</span>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState icon={FileText} title={emptyLabel} className="py-8" />
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((item) => {
            const inner = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-muted">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-ink tabular-nums">{money(item.amount)}</span>
                  <StatusBadge status={item.status} />
                </div>
              </>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="flex items-center justify-between px-5 py-3 hover:bg-raised transition-colors">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between px-5 py-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
