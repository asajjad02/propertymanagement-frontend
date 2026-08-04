'use client';

import { Download, Mail, MessageCircle, Smartphone } from 'lucide-react';
import { useState } from 'react';

import { sendBill } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { toApiError } from '@/lib/errors';

/**
 * Produce & deliver the combined monthly bill. PDF (via the browser-rendered
 * print route) and email are live; SMS and WhatsApp aren't wired to a provider
 * yet, so they stay honestly disabled.
 */
export function SendPanel({ billId }: { billId: number }) {
  const toast = useToast();
  const [emailing, setEmailing] = useState(false);

  function download() {
    // The branded bill is rendered in the browser; open the print route, which
    // prints/saves to PDF. Same output as the on-screen bill and the Print button.
    window.open(`/print/bill/${billId}?auto=1`, '_blank', 'noopener');
  }

  async function email() {
    setEmailing(true);
    try {
      await sendBill(billId, { channel: 'email' });
      toast.success('Bill emailed', 'Sent to the resident/owner on file.');
    } catch (err) {
      toast.error('Could not send', toApiError(err).message);
    } finally {
      setEmailing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produce &amp; send</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2">
        <Button variant="secondary" className="w-full justify-start" onClick={download}>
          <Download className="h-4 w-4" /> Download PDF
        </Button>
        <Button variant="secondary" className="w-full justify-start" onClick={email} disabled={emailing}>
          {emailing ? <Spinner /> : <Mail className="h-4 w-4" />} Email bill
        </Button>
        <div className="pt-1">
          <button disabled className="flex w-full items-center gap-2 rounded-control border border-hairline bg-raised px-3 py-2 text-sm text-muted opacity-70">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
          <button disabled className="mt-2 flex w-full items-center gap-2 rounded-control border border-hairline bg-raised px-3 py-2 text-sm text-muted opacity-70">
            <Smartphone className="h-4 w-4" /> SMS
          </button>
          <p className="pt-1.5 text-xs text-faint">SMS &amp; WhatsApp delivery aren’t available in this version yet.</p>
        </div>
      </CardBody>
    </Card>
  );
}
