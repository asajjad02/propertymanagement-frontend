# Hash Residency: Frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 frontend for the Hash
Residency apartment management system. It talks to the Django REST API in
[`../backend`](../backend).

> **Status:** core modules built. Auth, app shell, and the Flats, Residents,
> Visitors, and Electricity Billing screens are implemented against the live API
> using a Radix-based UI kit and the design tokens from the wireframe spec.
> Maintenance, Staff, Expenses, Complaints, and Reports are sidebar placeholders
> ("Soon") awaiting their backend endpoints. See `GUIDELINES.md` for conventions.

## Getting started

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL if not localhost:8000
npm install
npm run dev                  # http://localhost:3000
```

The backend must be running on the URL in `NEXT_PUBLIC_API_URL` (default
`http://localhost:8000/api`). Its CORS config already allows
`http://localhost:3000`.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck

## Architecture (data layer)

```
src/
  types/
    api.ts            Domain models + enums mirroring the DRF serializers.
    http.ts           Paginated<T>, ListParams, ApiError shapes.
  lib/
    config.ts         Reads NEXT_PUBLIC_* env (API_URL).
    token-storage.ts  Access/refresh tokens in localStorage + cleared notifier.
    api-client.ts     Axios instance: attaches bearer token, single-flight
                      refresh + retry on 401, forced logout on refresh failure.
    errors.ts         Normalizes DRF error bodies into ApiError.
    query-keys.ts     TanStack Query key factory (per-resource namespacing).
  api/
    auth.ts           login / register / me / logout (token side effects).
    resource.ts       Generic typed CRUD client for a DRF ModelViewSet path.
    endpoints.ts      One resource per viewset + custom billing actions.
  hooks/
    create-resource-hooks.ts  Turns a Resource into list/detail/CRUD hooks.
    resources.ts      Ready-made hooks per resource (buildingHooks, ...).
  providers/
    query-provider.tsx   TanStack Query client.
    auth-provider.tsx    Auth context: bootstraps /me, login/register/logout,
                         role checks. Source of truth for user/account/role.
    app-providers.tsx    Composes the above; mounted in app/layout.tsx.
```

### Auth flow

JWT (SimpleJWT) with 15-min access + 7-day rotating refresh tokens. Tokens are
stored in `localStorage`. `api-client.ts` refreshes the access token
transparently on a 401 and retries once; a failed refresh clears tokens and
notifies `AuthProvider`, which drops the session. Consume auth via `useAuth()`.

### Data access

Every backend resource has a hook bundle in `src/hooks/resources.ts`:

```ts
const { useList, useItem, useCreate, useUpdate, usePatch, useDelete } = buildingHooks;
const { data } = buildingHooks.useList({ search: 'A', filters: { status: 'active' } });
```

List endpoints support `page`, `search`, `ordering`, and per-viewset filters
(see each viewset's `filterset_fields` in the backend). Responses are the DRF
`PageNumberPagination` envelope (`Paginated<T>`), page size 20.

Custom billing actions are exported as dedicated mutation hooks:
`useEnterBillReading`, `useMarkElectricityBillPaid`, `useMarkMaintenanceChargePaid`.

## Roles

`admin`, `manager`, `accountant`, `security`. The role comes from `/auth/me/`
and is exposed via `useAuth().role` / `useAuth().hasRole(...)`. Write access per
resource is enforced server-side; mirror it in the UI when pages are built:

- Properties / residents: write = admin, manager
- Billing (bills, charges, payments, meters): write = admin, manager, accountant
- Electricity/maintenance rates: write = admin only
- Visitors: write = admin, manager, security
