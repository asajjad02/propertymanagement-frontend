import { AtriumLogo, AtriumMark } from '@/components/brand/atrium-logo';

/** Atrium product brand: Aperture mark + wordmark (mark only when collapsed). */
export function Brand({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) return <AtriumMark size={32} />;
  return <AtriumLogo markSize={32} />;
}
