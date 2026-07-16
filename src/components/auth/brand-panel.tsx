import { Building2, ReceiptText, Users } from 'lucide-react';

import { AtriumLogo, AtriumMark } from '@/components/brand/atrium-logo';

/**
 * Decorative brand panel for the auth split. A committed teal world (same in
 * light and dark, so it always contrasts with the form column) with a faint
 * aperture watermark, a professional product glimpse, and value props. Hidden
 * below ~1024px.
 */
const kpis = [
  { label: 'Occupancy', value: '94%' },
  { label: 'Collected', value: '98%' },
  { label: 'Open requests', value: '2' },
];

const points = [
  { icon: Building2, label: 'Flats & apartment types' },
  { icon: Users, label: 'Residents, owners & visitors' },
  { icon: ReceiptText, label: 'One combined monthly bill' },
];

export function BrandPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#0b3d38] p-12 text-white">
      {/* Ambient teal wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 90% at 12% 6%, rgba(20,184,166,0.40) 0%, rgba(11,61,56,0) 55%)',
        }}
      />
      {/* Faint architectural grid, masked toward the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(80% 80% at 28% 24%, #000 30%, transparent 100%)',
        }}
      />
      {/* Oversized aperture watermark */}
      <AtriumMark
        variant="plain"
        size={520}
        className="pointer-events-none absolute -bottom-32 -left-28 text-white/[0.05]"
      />

      <div className="relative">
        <AtriumLogo markSize={34} onDark />
      </div>

      <div className="relative space-y-7">
        <div>
          <h2 className="display max-w-md text-[2.4rem] leading-[1.1] text-white">
            The calm command center for your property.
          </h2>
          <p className="mt-3 max-w-md text-[0.975rem] leading-relaxed text-white/70">
            Flats, residents, owners, and one combined monthly bill — in a single, quiet
            workspace built for property teams.
          </p>
        </div>

        {/* Product glimpse — illustrative, not live data. */}
        <div className="max-w-md rounded-card bg-white/[0.06] p-5 shadow-pop ring-1 ring-white/12 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-white/55">
              This month
            </span>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-white/35">
              Sample
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {kpis.map((k) => (
              <div key={k.label}>
                <p className="display text-2xl tabular-nums text-white">{k.value}</p>
                <p className="mt-0.5 text-xs text-white/55">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="relative flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-6">
        {points.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-sm text-white/80">
            <p.icon className="h-4 w-4 text-white/60" />
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
