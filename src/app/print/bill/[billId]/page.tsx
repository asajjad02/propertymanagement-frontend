'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';

import { fetchBillTokens } from '@/api/endpoints';
import { BillSheet } from '@/components/billing/bill-sheet';

/**
 * Full-page, chrome-free bill: the account's branded template rendered in the
 * browser, filled with the backend's display-ready tokens. Opened with
 * `?auto=1` it prints itself; `?embed=1` is the on-screen iframe view (no
 * toolbar, scaled to width). This is the same route embedded in the bill detail.
 */
export default function BillPrintPage() {
  const params = useParams<{ billId: string }>();
  const id = Number(params.billId);
  const search = useSearchParams();

  const { data: tokens, isLoading, isError } = useQuery({
    queryKey: ['bills', id, 'tokens'],
    queryFn: () => fetchBillTokens(id),
    enabled: Number.isFinite(id),
  });

  if (isLoading) return <p style={{ padding: 40, fontFamily: 'system-ui', color: '#6b6760' }}>Loading bill…</p>;
  if (isError || !tokens) return <p style={{ padding: 40, fontFamily: 'system-ui', color: '#6b6760' }}>Could not load this bill.</p>;

  return <BillSheet tokens={tokens} embed={search.get('embed') === '1'} auto={search.get('auto') === '1'} />;
}
