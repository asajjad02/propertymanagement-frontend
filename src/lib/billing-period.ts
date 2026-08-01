/**
 * The billing period a new monthly bill covers.
 *
 * Shared by the meter round and the New Bill form so the two can't drift apart:
 * a bill created either way covers the same window. The backend derives
 * everything else at issue time (`previous_outstanding` from the flat's unpaid
 * bills, `maintenance_charge` from its apartment type, the unit rate from the
 * building's effective-dated rate), so this pair of dates is the only billing
 * rule the frontend owns — change it here and both screens follow.
 *
 * Assumption: "Monthly Bills" means a calendar month. If a cycle ever runs
 * mid-month, or should continue from the previous bill's end date, this is the
 * one function to change.
 */
export interface BillingPeriod {
  /** ISO date, first day of the month. */
  start: string;
  /** ISO date, last day of the month. */
  end: string;
}

/** Local-date ISO (`YYYY-MM-DD`) — never `toISOString()`, which shifts to UTC. */
function isoDate(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** The calendar month containing `on` (defaults to today). */
export function billingPeriodFor(on: Date = new Date()): BillingPeriod {
  return {
    start: isoDate(new Date(on.getFullYear(), on.getMonth(), 1)),
    // Day 0 of the next month is the last day of this one.
    end: isoDate(new Date(on.getFullYear(), on.getMonth() + 1, 0)),
  };
}
