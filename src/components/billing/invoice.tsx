import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { money, numeric, shortDate } from '@/lib/format';
import type { Building, ElectricityBill, Flat } from '@/types/api';

/** The printable invoice. Its hero is the meter calculation strip. */
export function Invoice({
  bill,
  flat,
  building,
  meterNumber,
}: {
  bill: ElectricityBill;
  flat: Flat | null;
  building: Building | null;
  meterNumber: string | null;
}) {
  const hasReading = bill.current_reading != null && bill.status !== 'draft';

  return (
    <Card className="overflow-hidden">
      {/* Masthead */}
      <div className="flex items-start justify-between border-b border-hairline p-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-control bg-primary font-display text-white">H</div>
            <span className="font-medium text-ink">Hash Residency</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {building?.name ?? 'Building'} · Flat {flat?.flat_number ?? '—'} · Meter {meterNumber ?? '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="label-mono">Bill</p>
          <p className="font-display text-2xl text-ink">#{bill.id}</p>
          <p className="mt-1 text-xs text-muted">
            {shortDate(bill.billing_period_start)} – {shortDate(bill.billing_period_end)}
          </p>
        </div>
      </div>

      {/* Calculation strip */}
      {hasReading ? (
        <div className="grid grid-cols-2 gap-4 bg-primary-soft/60 p-5 sm:grid-cols-4">
          <CalcCell label="Previous" value={numeric(bill.previous_reading)} />
          <CalcCell label="Current" value={numeric(bill.current_reading)} />
          <CalcCell label="Units × rate" value={`${numeric(bill.units_consumed)} × ${money(bill.unit_rate)}`} />
          <CalcCell label="Charge" value={money(bill.electricity_charge)} emphasis />
        </div>
      ) : (
        <div className="bg-warn-soft/50 p-5 text-sm text-warn">
          Reading not entered yet. Enter the current meter reading to calculate and issue this bill.
        </div>
      )}

      {/* Charge lines */}
      <div className="space-y-2 p-5">
        <Line label="Electricity charge" value={money(bill.electricity_charge)} />
        <Line label="Previous outstanding" value={money(bill.previous_outstanding)} />
        <div className="mt-2 flex items-center justify-between border-t border-hairline pt-3">
          <span className="flex items-center gap-2 font-medium text-ink">
            Total payable <StatusBadge status={bill.status} />
          </span>
          <span className="font-display text-2xl text-ink">{money(bill.total_payable)}</span>
        </div>
      </div>
    </Card>
  );
}

function CalcCell({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <p className="label-mono">{label}</p>
      <p className={`mt-1 font-mono text-sm tabular-nums ${emphasis ? 'font-semibold text-ink' : 'text-ink-secondary'}`}>
        {value}
      </p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-ink tabular-nums">{value}</span>
    </div>
  );
}
