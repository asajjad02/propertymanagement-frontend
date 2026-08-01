import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { money } from '@/lib/format';

/** Sticky dues summary for the flat detail aside. */
export function AccountSummary({
  outstanding,
  billCount,
  chargeCount,
  className,
}: {
  outstanding: number;
  billCount: number;
  chargeCount: number;
  className?: string;
}) {
  const clear = outstanding <= 0;
  return (
    // Sticky only where it's an aside; on mobile it's the first block and
    // sticking it would pin it over the content below.
    <Card className={cn('lg:sticky lg:top-20', className)}>
      <CardHeader>
        <CardTitle>Account summary</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <p className="label-mono">Outstanding dues</p>
          <p className={`mt-1 display text-3xl tabular-nums ${clear ? 'text-ok' : 'text-danger'}`}>
            {clear ? money(0) : money(outstanding)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {clear ? 'All bills settled' : 'Across unpaid electricity & maintenance'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-sm">
          <div>
            <p className="label-mono">Elec. bills</p>
            <p className="mt-0.5 text-ink tabular-nums">{billCount}</p>
          </div>
          <div>
            <p className="label-mono">Maint. charges</p>
            <p className="mt-0.5 text-ink tabular-nums">{chargeCount}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
