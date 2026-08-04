'use client';

// Bundled so rendering never depends on a font CDN (see the template notes).
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/parisienne/400.css';

import { useEffect, useRef } from 'react';

import { BILL_CSS, derivePalette, fillBill } from '@/lib/bill-template';

// Page-level CSS: A4 print box, screen backdrop, and the (screen-only) toolbar.
const PAGE_CSS = String.raw`
  @page { size: A4; margin: 0; }
  html, body { margin: 0; background: #fff; }
  /* This route renders under the app's root layout, whose theme (often dark)
     sits behind it. .billroot is an opaque light document that covers it, so the
     backdrop is never the app's dark canvas. */
  .billroot { padding: 20px 12px 60px; background: #E7E2DC; min-height: 100vh; }
  .print-toolbar {
    position: fixed; top: 16px; right: 16px; z-index: 20; display: flex; gap: 8px;
  }
  .print-toolbar button {
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    color: #fff; background: var(--ink); border: 0; border-radius: 8px;
    padding: 9px 16px; cursor: pointer; box-shadow: 0 6px 18px rgba(74,52,40,.28);
  }
  @media print {
    html, body { background: #fff; }
    .billroot { padding: 0; background: #fff; min-height: 0; }
    .print-toolbar { display: none; }
  }
`;

/**
 * Renders one branded bill from its display-ready tokens. Chrome does the
 * layout, fonts, and the one-page fit; this is the single rendering path behind
 * both the print route and the Configuration preview.
 *
 * - `embed`: scale the fixed A4 sheet to the container width (for the iframe
 *   on-screen view) and hide the print toolbar.
 * - `auto`: print once fonts and images have settled (the "Print" action).
 */
export function BillSheet({
  tokens,
  embed = false,
  auto = false,
}: {
  tokens: Record<string, string>;
  embed?: boolean;
  auto?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Fit each .page to one A4 page — full size, scaled down only if it would
  // spill. (Port of the template's own script; injected <script> doesn't run.)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const A4 = (297 * 96) / 25.4;
    const MIN = 0.75;
    const fit = () => {
      root.querySelectorAll<HTMLElement>('.page').forEach((page) => {
        let k = 1;
        for (let i = 0; i < 6; i++) {
          page.style.setProperty('--fit', String(k));
          const natural = page.scrollHeight;
          const avail = A4 / k;
          if (natural <= avail + 0.5) break;
          k = Math.max(MIN, k * (avail / natural));
        }
      });
    };

    fit();
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      fit();
      if (auto) setTimeout(() => window.print(), 200);
    };
    const imgs = Array.from(root.querySelectorAll('img'));
    const fontsReady =
      (document as { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
    Promise.all([
      fontsReady,
      ...imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = img.onerror = () => res(null);
            }),
      ),
    ]).then(settle);
    const fallback = setTimeout(settle, 3000);

    window.addEventListener('resize', fit);
    return () => {
      clearTimeout(fallback);
      window.removeEventListener('resize', fit);
    };
  }, [tokens, auto]);

  // Embedded: scale the fixed A4 sheet (210mm ≈ 794px) to the container width;
  // the iframe carries an A4 aspect-ratio, so the scaled sheet fills it exactly.
  useEffect(() => {
    const root = rootRef.current;
    if (!embed || !root) return;
    const SHEET_PX = (210 * 96) / 25.4;
    const scaleToWidth = () => {
      const scale = document.documentElement.clientWidth / SHEET_PX;
      root.style.width = `${SHEET_PX}px`;
      root.style.transformOrigin = 'top left';
      root.style.transform = `scale(${scale})`;
    };
    scaleToWidth();
    window.addEventListener('resize', scaleToWidth);
    return () => window.removeEventListener('resize', scaleToWidth);
  }, [embed, tokens]);

  // The whole warm palette is derived from the brand colour, so selecting a
  // colour rethemes the bill (creams, hairlines, muted tones), not just the ink.
  const palette = derivePalette(tokens.brand_color || '#4A3428');

  return (
    <div
      className="billroot"
      ref={rootRef}
      style={
        {
          ...palette,
          ...(embed ? { padding: 0, minHeight: 0, background: '#fff' } : {}),
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS + BILL_CSS }} />
      {!embed && (
        <div className="print-toolbar">
          <button type="button" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: fillBill(tokens) }} />
    </div>
  );
}
