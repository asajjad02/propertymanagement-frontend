'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { fetchBillTokens } from '@/api/endpoints';
import { BillSheet } from '@/components/billing/bill-sheet';

const stateStyle = { padding: 40, fontFamily: 'system-ui', color: '#6b6760' } as const;

/**
 * Full-page, chrome-free bill: the account's branded template rendered in the
 * browser, filled with the backend's display-ready tokens. Opened with
 * `?auto=1` it prints itself; `?embed=1` is the on-screen iframe view (no
 * toolbar, scaled to width). This is the same route embedded in the bill detail.
 */
function BillPrint() {
  const params = useParams<{ billId: string }>();
  const id = Number(params.billId);
  const search = useSearchParams();

  const { data: tokens, isLoading, isError } = useQuery({
    queryKey: ['bills', id, 'tokens'],
    queryFn: () => fetchBillTokens(id),
    enabled: Number.isFinite(id),
  });

  // Name the saved PDF after the flat + month: Chrome's "Save as PDF" defaults
  // to the document title, so the manager's file is "A-101 — August 2026.pdf",
  // filed and shareable per flat without renaming.
  useEffect(() => {
    if (tokens?.apt) {
      const month = tokens.billing_month ? ` — ${tokens.billing_month}` : '';
      document.title = `${tokens.apt}${month}`;
    }
  }, [tokens]);

  if (isLoading) return <p style={stateStyle}>Loading bill…</p>;
  if (isError || !tokens) return <p style={stateStyle}>Could not load this bill.</p>;

  return <BillSheet tokens={tokens} embed={search.get('embed') === '1'} auto={search.get('auto') === '1'} />;
}

export default function BillPrintPage() {
  // useSearchParams needs a Suspense boundary during prerender (Next App Router).
  return (
    <Suspense fallback={<p style={stateStyle}>Loading bill…</p>}>
      <BillPrint />
    </Suspense>
  );
}
