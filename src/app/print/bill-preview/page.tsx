'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { fetchBillTemplatePreviewData } from '@/api/endpoints';
import { BillSheet } from '@/components/billing/bill-sheet';

const stateStyle = { padding: 40, fontFamily: 'system-ui', color: '#6b6760' } as const;

/**
 * The bill template rendered with sample figures and the account's saved
 * branding, for the Configuration editor's live preview. Embedded (iframe) in
 * the editor; the editor bumps a nonce in the URL to reload it after a save.
 */
function Preview() {
  const embed = useSearchParams().get('embed') === '1';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['billing', 'template', 'preview-data'],
    queryFn: fetchBillTemplatePreviewData,
  });

  if (isLoading) return <p style={stateStyle}>Loading preview…</p>;
  if (isError || !data) return <p style={stateStyle}>Preview unavailable.</p>;

  return <BillSheet tokens={data} embed={embed} />;
}

export default function BillPreviewPage() {
  // useSearchParams needs a Suspense boundary during prerender (Next App Router).
  return (
    <Suspense fallback={<p style={stateStyle}>Loading preview…</p>}>
      <Preview />
    </Suspense>
  );
}
