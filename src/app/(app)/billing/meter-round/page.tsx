'use client';

import { Camera, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { uploadDocument } from '@/api/documents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadingBlock } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { electricityBillHooks, useEnterBillReading } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { numeric } from '@/lib/format';
import type { ElectricityBill } from '@/types/api';

const TODAY = new Date().toISOString().slice(0, 10);

export default function MeterRoundPage() {
  const flats = useFlatsLookup();
  const drafts = electricityBillHooks.useAll({ filters: { status: 'draft' } });

  const bills = drafts.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/billing" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Monthly Bills
        </Link>
        <h1 className="display mt-2.5 text-[1.75rem] text-ink">Meter round</h1>
        <p className="mt-1.5 text-sm text-muted">
          Walk the property, snap each meter, and enter its reading. Each reading issues that flat's
          combined monthly bill.
        </p>
      </div>

      {drafts.isPending ? (
        <Card><LoadingBlock label="Loading meters…" /></Card>
      ) : bills.length === 0 ? (
        <Card>
          <EmptyState
            title="No pending readings"
            description="Every draft bill has been read. Create bills from Monthly Bills to start a new cycle."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <MeterRow key={bill.id} bill={bill} flatNumber={flats.map.get(bill.flat)?.flat_number ?? `Flat #${bill.flat}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function MeterRow({ bill, flatNumber }: { bill: ElectricityBill; flatNumber: string }) {
  const toast = useToast();
  const enterReading = useEnterBillReading();
  const [reading, setReading] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [done, setDone] = useState(false);

  async function issue() {
    if (!reading) return;
    try {
      await enterReading.mutateAsync({ id: bill.id, payload: { current_reading: reading, reading_date: TODAY } });
      if (photo) {
        try {
          await uploadDocument({ file: photo, related_model: 'electricity_bill', related_id: bill.id, document_type: 'meter_photo' });
        } catch {
          toast.warning('Bill issued, photo failed', `${flatNumber}: reading saved but the photo didn't upload.`);
          setDone(true);
          return;
        }
      }
      toast.success('Bill issued', `${flatNumber} · reading ${numeric(reading)}`);
      setDone(true);
    } catch {
      toast.error('Could not issue bill', `${flatNumber}: check the reading is above the previous value.`);
    }
  }

  if (done) {
    return (
      <Card className="flex items-center gap-3 px-4 py-3 opacity-70">
        <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-ok-soft text-ok"><Check className="h-3.5 w-3.5" /></span>
        <span className="text-sm font-medium text-ink">{flatNumber}</span>
        <span className="ml-auto text-xs text-muted tabular-nums">reading {numeric(reading)}</span>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold text-ink">{flatNumber}</span>
        <span className="label-mono">Prev {numeric(bill.previous_reading)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          placeholder="Current reading"
          className="h-12 flex-1 text-base"
          aria-label={`${flatNumber} current reading`}
        />
        <label
          className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-control border transition-colors ${
            photo ? 'border-primary bg-primary-soft text-primary-text' : 'border-hairline text-muted hover:border-muted/40'
          }`}
          aria-label="Capture meter photo"
        >
          <Camera className="h-5 w-5" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button onClick={issue} disabled={enterReading.isPending || !reading} className="h-12 px-5">
          Issue
        </Button>
      </div>
      {photo && <p className="mt-1.5 text-xs text-muted">Photo attached · {photo.name}</p>}
    </Card>
  );
}
