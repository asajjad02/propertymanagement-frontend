import { cn } from '@/lib/cn';

import { Card, CardBody, CardHeader, CardTitle } from './card';

export interface InfoField {
  label: string;
  value: React.ReactNode;
  /** Span both columns (e.g. an address). */
  full?: boolean;
}

export interface InfoCardProps {
  title: string;
  fields: InfoField[];
  action?: React.ReactNode;
  className?: string;
}

/** Card with a mono-caps title and a two-column label/value field grid. */
export function InfoCard({ title, fields, action, className }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {fields.map((field, i) => (
            <div key={i} className={cn(field.full && 'sm:col-span-2')}>
              <dt className="label-mono">{field.label}</dt>
              <dd className="mt-1 text-sm text-ink">{field.value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
