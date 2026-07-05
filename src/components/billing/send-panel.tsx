import { MessageCircle, Smartphone } from 'lucide-react';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Delivery panel. WhatsApp/SMS dispatch is part of the deferred async pipeline
 * (not wired on the backend yet), so both channels render disabled — honest
 * placeholders rather than fake controls.
 */
export function SendPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send invoice</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2">
        <button
          disabled
          className="flex w-full items-center gap-2 rounded-control border border-hairline bg-paper px-3 py-2 text-sm text-muted opacity-70"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </button>
        <button
          disabled
          className="flex w-full items-center gap-2 rounded-control border border-hairline bg-paper px-3 py-2 text-sm text-muted opacity-70"
        >
          <Smartphone className="h-4 w-4" /> SMS
        </button>
        <p className="pt-1 text-xs text-faint">Messaging isn’t available in this version yet.</p>
      </CardBody>
    </Card>
  );
}
