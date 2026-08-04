'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, FileWarning } from 'lucide-react';
import { useEffect, useState } from 'react';

import { downloadBillPdf } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { ElectricityBill } from '@/types/api';

/**
 * The bill as the resident sees it: the account's branded template rendered by
 * the backend, embedded here. This is the single source of truth for bill
 * presentation — there is no parallel React layout to drift from the PDF.
 * Drafts (no reading) have no meaningful bill yet, so we prompt instead.
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

  return <BillPdf billId={bill.id} />;
}

function BillPdf({ billId }: { billId: number }) {
  const pdf = useQuery({ queryKey: ['bills', billId, 'pdf'], queryFn: () => downloadBillPdf(billId) });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdf.data) return;
    const objectUrl = URL.createObjectURL(pdf.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdf.data]);

  function download() {
    if (!pdf.data) return;
    const objectUrl = URL.createObjectURL(pdf.data);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `bill-${billId}.pdf`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline p-3">
        <p className="label-mono">Bill document</p>
        <Button variant="secondary" size="sm" onClick={download} disabled={!pdf.data}>
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>
      <div className="h-[720px] bg-raised">
        {pdf.isError ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
            Could not generate the bill PDF.
          </div>
        ) : url ? (
          <object data={url} type="application/pdf" className="h-full w-full">
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
              Your browser can’t display the PDF inline. Use Download above.
            </div>
          </object>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </Card>
  );
}
