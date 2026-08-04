'use client';

import { FileWarning, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ElectricityBill } from '@/types/api';

/**
 * The bill as the resident sees it: the account's branded template, rendered in
 * the browser (Chrome does layout, fonts and the one-page fit) and embedded via
 * the chrome-free /print/bill route. That same route, opened in its own tab,
 * prints to a pixel-perfect PDF — so what staff review is exactly what a
 * resident gets, with no second layout to drift. Drafts have no meaningful bill
 * yet, so we prompt instead.
 */
export function BillDocument({ bill }: { bill: ElectricityBill }) {
  const hasReading = bill.current_reading != null && bill.status !== 'draft';

  if (!hasReading) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-2 p-8 text-center">
        <FileWarning className="h-8 w-8 text-warn" />
        <p className="font-medium text-ink">Bill not issued yet</p>
        <p className="max-w-sm text-sm text-muted">
          Enter the current meter reading to calculate and issue this bill. The branded bill
          appears here once it’s issued.
        </p>
      </Card>
    );
  }

  const view = `/print/bill/${bill.id}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline p-3">
        <p className="label-mono">Bill document</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(`${view}?auto=1`, '_blank', 'noopener')}
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>
      {/* A4 aspect box; the embedded route scales the sheet to this width. */}
      <iframe
        src={`${view}?embed=1`}
        title={`Bill #${bill.id}`}
        className="block w-full border-0 bg-raised"
        style={{ aspectRatio: '210 / 297' }}
      />
    </Card>
  );
}
