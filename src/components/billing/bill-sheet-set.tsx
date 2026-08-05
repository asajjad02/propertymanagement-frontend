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

/*
 * Page-level CSS for a stack of bills.
 *
 * `.sheet` is the load-bearing part. A `.page` sizes itself as
 * `page_h / fit` and then `transform: scale(fit)` to fit A4 — but a transform
 * doesn't change an element's layout box, so a scaled-down page still *occupies*
 * more than A4 in the flow. One bill never noticed; a stack of them would drift a
 * little further off each sheet all the way down. So each bill gets a wrapper
 * fixed at exactly A4 with the overflow clipped, and the page break hangs off the
 * wrapper rather than the page.
 */
const SET_CSS = String.raw`
  @page { size: A4; margin: 0; }
  html, body { margin: 0; background: #fff; }
  /* Opaque light document: this route renders under the app's root layout, whose
     theme is often dark. */
  .billset { background: #E7E2DC; padding: 20px 12px 60px; min-height: 100vh; }
  .sheet {
    width: 210mm; height: 297mm; overflow: hidden;
    margin: 0 auto 20px; background: #fff; box-shadow: 0 6px 18px rgba(74,52,40,.18);
  }
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
    .billset { padding: 0; background: #fff; min-height: 0; }
    .sheet { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
    /* No trailing blank sheet. */
    .sheet:last-child { break-after: auto; page-break-after: auto; }
    .print-toolbar { display: none; }
  }
`;

/**
 * Renders many branded bills as one printable document — one A4 sheet each.
 *
 * Goes through the same `fillBill` + `BILL_CSS` as the single-bill sheet, on
 * purpose: a bulk print that looked different from the bill a resident gets
 * individually is the bug this replaces. The template, palette and fonts are all
 * the account's own.
 *
 * The CSS, the fit pass and the print call each happen once for the whole stack.
 * Rendering `BillSheet` in a loop instead would inject the stylesheet per bill,
 * show a toolbar per bill, and — with `auto` — open one print dialog per bill.
 */
export function BillSheetSet({
  bills,
  auto = false,
}: {
  /** Display-ready token sets, in the order they should print. */
  bills: Record<string, string>[];
  /** Print as soon as fonts and images have settled. */
  auto?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const printed = useRef(false);

  // Fit every .page to its sheet — full size, scaled down only if it would spill.
  // Same algorithm as the single sheet, run across the whole stack at once.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || bills.length === 0) return;
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
    // Images (a logo) and webfonts land after first paint and change the height
    // the fit was measured from, so measure again once they have.
    const onLoad = () => fit();
    const images = Array.from(root.querySelectorAll('img'));
    images.forEach((img) => img.addEventListener('load', onLoad));
    const fonts = document.fonts?.ready ?? Promise.resolve();

    let timer: ReturnType<typeof setTimeout> | undefined;
    void fonts.then(() => {
      fit();
      // Once, however many bills are in the stack — a print dialog per bill would
      // be unusable.
      if (auto && !printed.current) {
        printed.current = true;
        timer = setTimeout(() => window.print(), 400);
      }
    });

    return () => {
      images.forEach((img) => img.removeEventListener('load', onLoad));
      if (timer) clearTimeout(timer);
    };
  }, [bills, auto]);

  // One palette for the stack: the brand colour belongs to the account, not to
  // an individual bill.
  const palette = derivePalette(bills[0]?.brand_color || '#4A3428');

  return (
    <div className="billset" ref={rootRef} style={palette as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: SET_CSS + BILL_CSS }} />
      <div className="print-toolbar">
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF ({bills.length})
        </button>
      </div>
      {bills.map((tokens, i) => (
        <div className="sheet" key={`${tokens.apt ?? 'bill'}-${i}`}>
          <div dangerouslySetInnerHTML={{ __html: fillBill(tokens) }} />
        </div>
      ))}
    </div>
  );
}
