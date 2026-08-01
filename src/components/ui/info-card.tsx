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

/**
 * Card with a mono-caps title and a set of label/value fields.
 *
 * Two shapes. Mobile reads them as a divided list — label left, value right,
 * one line each — which is roughly half the height of a stacked
 * label-above-value block and scans like a native settings screen. From `sm`
 * up it's the original two-column grid, where the extra width makes stacking
 * legible again.
 */
export function InfoCard({ title, fields, action, className }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardBody className="py-1 sm:py-5">
        <dl className="divide-y divide-hairline sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 sm:divide-y-0">
          {fields.map((field, i) => (
            <div
              key={i}
              className={cn(
                'flex items-baseline justify-between gap-4 py-2.5',
                'sm:block sm:py-0',
                field.full && 'sm:col-span-2',
              )}
            >
              <dt className="label-mono shrink-0">{field.label}</dt>
              <dd className="min-w-0 text-right text-sm text-ink sm:mt-1 sm:text-left">
                {field.value ?? '—'}
              </dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
