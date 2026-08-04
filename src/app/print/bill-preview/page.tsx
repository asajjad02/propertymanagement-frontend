'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { fetchBillTemplatePreviewData } from '@/api/endpoints';
import { BillSheet } from '@/components/billing/bill-sheet';

/**
 * The bill template rendered with sample figures and the account's saved
 * branding, for the Configuration editor's live preview. Embedded (iframe) in
 * the editor; the editor bumps a nonce in the URL to reload it after a save.
 */
export default function BillPreviewPage() {
  const embed = useSearchParams().get('embed') === '1';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['billing', 'template', 'preview-data'],
    queryFn: fetchBillTemplatePreviewData,
  });

  if (isLoading) return <p style={{ padding: 40, fontFamily: 'system-ui', color: '#6b6760' }}>Loading preview…</p>;
  if (isError || !data) return <p style={{ padding: 40, fontFamily: 'system-ui', color: '#6b6760' }}>Preview unavailable.</p>;

  return <BillSheet tokens={data} embed={embed} />;
}
