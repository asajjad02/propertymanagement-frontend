'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

import { visitors as visitorsResource } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import { dateTime } from '@/lib/format';
import type { ListParams } from '@/types/http';

const HEADERS = ['Visitor', 'Flat', 'Host', 'Contact', 'Entry', 'Exit', 'Status'];

/** Quote a CSV cell only when it contains a delimiter, quote, or newline. */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Downloads the currently-filtered visitors as a CSV (for the shift-handover
 * daily report). Walks all pages for the active filter so the export matches
 * what the filter selects, not just the current page.
 */
export function ExportVisitorsButton({ listParams }: { listParams: ListParams }) {
  const toast = useToast();
  const flats = useFlatsLookup();
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      const all = await visitorsResource.listAll({ ...listParams, page: 1 });
      const lines = [HEADERS.join(',')];
      for (const v of all) {
        const cells = [
          v.visitor_name,
          flats.map.get(v.flat)?.flat_number ?? '',
          v.host_name || '',
          v.contact_number || '',
          v.entry_time ? dateTime(v.entry_time) : '',
          v.exit_time ? dateTime(v.exit_time) : '',
          v.exit_time ? 'Checked out' : 'Inside',
        ];
        lines.push(cells.map((c) => csvCell(String(c))).join(','));
      }
      // Prepend a BOM so Excel reads UTF-8; CRLF line endings for spreadsheets.
      const csv = `﻿${lines.join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitors-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export ready', `${all.length} visitor${all.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error('Export failed', toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={onExport} disabled={busy}>
      {busy ? <Spinner /> : <Download className="h-4 w-4" />}
      Export CSV
    </Button>
  );
}
