/**
 * Decorative dark brand panel for the login split layout. Purely visual — the
 * stat strip shows illustrative labels, not live data. Hidden below ~900px.
 */
const stats = [
  { label: 'Flats', value: 'Managed' },
  { label: 'Residents', value: 'Tracked' },
  { label: 'Collections', value: 'Reconciled' },
];

export function BrandPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-ink p-12 text-white">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary font-display text-lg">
          H
        </div>
        <span className="font-medium">Hash Residency</span>
      </div>

      <p className="max-w-md font-display text-4xl leading-tight">
        One portal for the whole society — property, people, and payments.
      </p>

      <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-white/50">{s.label}</p>
            <p className="mt-1 text-sm text-white/90">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
