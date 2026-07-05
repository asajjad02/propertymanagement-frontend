/** Map billing records to the shared BillingDocList item shape. */
import { shortDate } from '@/lib/format';
import type { ElectricityBill, MaintenanceCharge } from '@/types/api';

import type { BillingDocItem } from './billing-doc-list';

export function billsToDocItems(bills: ElectricityBill[]): BillingDocItem[] {
  return bills.map((b) => ({
    id: b.id,
    title: `Bill #${b.id}`,
    subtitle: `${shortDate(b.billing_period_start)} – ${shortDate(b.billing_period_end)}`,
    amount: b.total_payable,
    status: b.status,
    href: `/billing/electricity/${b.id}`,
  }));
}

export function chargesToDocItems(charges: MaintenanceCharge[]): BillingDocItem[] {
  return charges.map((c) => ({
    id: c.id,
    title: `Maintenance #${c.id}`,
    subtitle: shortDate(c.billing_period),
    amount: c.total_due,
    status: c.status,
    // Maintenance charges have no dedicated detail page.
  }));
}
