import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { money, shortDate } from '@/lib/format';
import type { ElectricityBill, Payment } from '@/types/api';

/** Payment summary + recorded payments for a bill. Actions live in the header. */
export function PaymentPanel({ bill, payments }: { bill: ElectricityBill; payments: Payment[] }) {
  const paid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const due = Math.max(0, (Number(bill.total_payable) || 0) - paid);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <StatusBadge status={bill.status} />
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="label-mono">Total</p>
            <p className="mt-0.5 font-mono text-ink tabular-nums">{money(bill.total_payable)}</p>
          </div>
          <div>
            <p className="label-mono">Due</p>
            <p className={`mt-0.5 font-mono tabular-nums ${due > 0 ? 'text-danger' : 'text-ok'}`}>{money(due)}</p>
          </div>
        </div>

        <div className="border-t border-hairline pt-3">
          <p className="label-mono mb-2">Recorded payments</p>
          {payments.length === 0 ? (
            <p className="text-sm text-muted">No payments recorded.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {shortDate(p.payment_date)} · <span className="capitalize">{p.payment_method}</span>
                  </span>
                  <span className="font-mono text-ink tabular-nums">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
