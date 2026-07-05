# Frontend Build Guidelines

Check generated code against this file regularly. If a rule is violated, fix it
before moving on.

## Golden rules

1. **Small files.** No file over ~200 lines; aim for under 150. If a component
   grows past that, split it (extract subcomponents, hooks, or helpers).
2. **One component per file.** Each component lives in its own file, named after
   it. Barrel `index.ts` re-exports are fine.
3. **Low redundancy (DRY).** Never copy-paste a pattern twice. Extract a shared
   primitive, hook, or helper. Data joins live in composite hooks, not in pages.
4. **Backend is the source of truth for business logic.** The wireframe informs
   *layout and structure only*. When they conflict, the API wins. Never invent
   fields, statuses, or endpoints the backend doesn't expose.
5. **Be honest about gaps.** For features the backend doesn't support yet
   (PDF export, SMS/WhatsApp send, documents, activity feed, global search),
   render a clear disabled / "not available yet" state — never a fake control.

## Architecture

- **Data layer** (`src/api`, `src/hooks`, `src/types`) is already built. Use the
  resource hooks (`buildingHooks.useList()`, etc.); don't call `apiClient`
  directly from components.
- **Composite hooks** (`src/hooks/*`) own cross-resource joins and derived data
  (e.g. flat + owner name + active tenant). Pages/components stay presentational.
- **Primitives** (`src/components/ui`) are generic and backend-agnostic:
  Button, Field, StatCard, DataTable, StatusBadge, TypeTag, Avatar, FilterBar,
  PageHeader, DetailHeader, Tabs, InfoCard, etc.
- **Feature components** (`src/components/<feature>`) compose primitives + hooks.
- **Pages** (`src/app/**`) are thin: wire route params, pick the feature
  components, and lay them out.

## Design tokens (from the wireframe spec — the single source)

- Surfaces: `paper #f6f5f1` · `surface #ffffff` · `raised #fcfbf8` · `hairline #e7e3da`
- Ink: `ink #1a1815` · `sec #403d37` · `muted #6b6760` · `faint #9c968b`
- Primary (indigo): `500 #5650e6` · `hover #443ecf` · `text #4a44cf` · `soft #ecebfc`
- Semantic: `ok #2f9d63` · `warn #c79219` · `danger #d65151` · `info #3f76dd`
- Type: display **Instrument Serif** (titles) · ui **Hanken Grotesk** (400/500/600) · data **IBM Plex Mono** (labels, numbers)
- Radius: control 9–10px · card 14px · pill 999px

Use the Tailwind theme tokens defined in `globals.css` (e.g. `bg-paper`,
`border-hairline`, `text-muted`, `text-primary`, `font-display`, `font-mono`).
Do not hardcode hex values in components.

## Visual language (from inspiration + spec)

- Warm off-white paper background; white cards with 1px hairline borders.
- **Mono-caps micro-labels**: small, uppercase, letter-spaced IBM Plex Mono for
  eyebrows, table headers, stat labels.
- Serif display for page/detail titles.
- Near-black primary buttons OR indigo primary per context; ghost/secondary are
  hairline-bordered.
- Numbers (readings, money) in mono, right-aligned in tables.
- Generous whitespace; content in a bordered grid feel.

## StatusBadge mapping (exact)

- green: Occupied · Paid · Active · Inside · Resolved
- amber: Unpaid · Pending · Open · Issued · Draft
- red: Overdue
- blue: Checked out
- neutral: Vacant · Tenant · —
- indigo: Owner

(Backend bill statuses are `draft` · `issued` · `paid` only — no "overdue".)

## Roles → write access (enforce in UI, mirror backend)

- Properties / residents: admin, manager
- Billing (bills, charges, payments, meters): admin, manager, accountant
- Rates: admin only
- Visitors: admin, manager, security

Hide/disable write actions the current role can't perform (`useAuth().hasRole`).
