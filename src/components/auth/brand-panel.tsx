/**
 * Decorative brand panel for the auth split layout. Deliberately dark in both
 * light and dark themes (a committed visual world), so it uses fixed near-black
 * values with a faint indigo wash rather than the theme tokens. The stat strip
 * shows illustrative labels, not live data. Hidden below ~900px.
 */
const stats = [
  { label: 'Flats', value: 'Managed' },
  { label: 'Residents', value: 'Tracked' },
  { label: 'Collections', value: 'Reconciled' },
];

export function BrandPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#0c0d11] p-12 text-white">
      {/* Ambient indigo wash + a faint architectural grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 82% 8%, rgba(20,168,154,0.22) 0%, rgba(12,13,17,0) 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(80% 80% at 70% 30%, #000 30%, transparent 100%)',
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-[1.05rem] font-semibold tracking-tight">
          H
        </div>
        <span className="font-semibold tracking-[-0.01em]">Hash Residency</span>
      </div>

      <p className="relative max-w-md display text-[2.6rem] leading-[1.08] text-white">
        One portal for the whole society — property, people, and payments.
      </p>

      <div className="relative grid grid-cols-3 gap-4 border-t border-white/12 pt-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.09em] text-white/45">
              {s.label}
            </p>
            <p className="mt-1 text-sm text-white/85">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
