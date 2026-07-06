'use client';

import { useQuery } from '@tanstack/react-query';
import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { downloadDocument } from '@/api/documents';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/cn';
import type { AppDocument } from '@/types/api';

/**
 * Renders an image document. The download endpoint is authed, so the bytes are
 * fetched via the API client and shown from an object URL. Click to open full.
 */
export function DocumentImage({ doc, className }: { doc: AppDocument; className?: string }) {
  const { data: blob, isPending, isError } = useQuery({
    queryKey: ['document', doc.id, 'blob'],
    queryFn: () => downloadDocument(doc.id),
    staleTime: Infinity,
  });

  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  const box = cn('h-20 w-20 overflow-hidden rounded-control border border-hairline bg-paper', className);

  if (isPending) {
    return <div className={cn(box, 'flex items-center justify-center')}><Spinner className="text-muted" /></div>;
  }
  if (isError || !url) {
    return <div className={cn(box, 'flex items-center justify-center')}><ImageOff className="h-4 w-4 text-faint" /></div>;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(box, 'block')} title={doc.file_name}>
        {/* eslint-disable-next-line @next/next/no-img-element -- authed object URL */}
        <img src={url} alt={doc.file_name} className="h-full w-full object-cover" />
      </button>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: url }]}
        controller={{ closeOnBackdropClick: true }}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </>
  );
}
