# Billing: opening readings, bill deletion, sorting

What changed, where, and why — for the round of work covering four asks:

1. bulk entry of previous/opening meter readings, without visiting every flat
2. whether flats created before the one-meter-per-flat change still work
3. the ability to delete a bill so it can be recreated
4. sorting bills by apartment number

All of it is frontend. The backend already carries the API surface each item
needs (see [What the backend already provides](#what-the-backend-already-provides)).

---

## The thing that was actually broken

The report was "apartments created before the meter change aren't working". It
wasn't the meter. Checked against the live database:

| Check | Result |
| --- | --- |
| Flats without a meter | **0** — nothing is meterless, so no flat hits the new `Meter.DoesNotExist` |
| Duplicate unique constraints | **none** — one per table, matching the repo |
| `migrate --check` | exits **0** |
| Occupied flats in the round | 60 |
| …of those, **no apartment type** | **18** |

`calculate_electricity_bill` now raises when a flat has no apartment type,
instead of silently billing Rs 0 maintenance on a statement captioned
"electricity + maintenance". That's the right call — but it means **18 of the 60
stops in the round fail at the moment the reading is submitted**, i.e. while
someone is standing at the meter. Affected: `1A`, `A-101`, `A-102`, `A-204`,
`A-305`, `A-701`, `B-101`, `B-203`, `B-204`, `B-402`, and 8 more.

**This is a data fix, not a code fix**: set an apartment type on those 18 flats.
Nothing in this changeset papers over it, because a bill with no maintenance
basis shouldn't be issued.

---

## Frontend changes

### New: bulk opening readings

`src/app/(app)/billing/opening-readings/page.tsx` — new screen.

A meter starts at 0 in the system; the dial on the wall doesn't. Billing
`current − 0` would charge a resident for the meter's entire lifetime, so every
flat needs its real starting figure recorded once. Previously that meant opening
each flat in turn — fifty round trips on a first month.

- One row per meter: flat number + a numeric field. Sorted naturally
  (`localeCompare` with `numeric: true`), so `A-2` sits before `A-10`.
- Defaults to **"Needs a reading"** (`current_reading` is 0), because that's the
  first-month case. "All flats" is one tap away.
- **Blank rows are never written.** Only fields typed into are sent, so the
  screen can't bulk-overwrite live meters.
- Writes to the **meter**, not to a bill. The meter's running value is what the
  server derives every future `previous_reading` from, so this sets the same
  field the meter round would have — just reachable in bulk.
- Saves in batches of 6 with a `try`/`catch` per row: one rejected reading must
  not discard the other forty-nine writes. Partial failure is reported honestly
  (`"42 saved, 3 failed"` naming the flats), failed rows stay filled in and turn
  red, and successful rows are cleared so a retry only re-sends the failures.
- Sticky save bar with a running count — with fifty rows, a button at the bottom
  of the list is a long scroll from the row you just filled in.

### Entry point where it's needed

`src/app/(app)/billing/meter-round/page.tsx`

Counts the stops that would have to invent a baseline
(`!stop.bill && Number(stop.previousReading) === 0`) and, when there's more than
one, offers the bulk screen **at the top of the round**. Opening readings get
copied off a sheet at a desk, not typed in a stairwell — so the round now points
at the desk job rather than asking for it mid-walk. A single such flat is left to
the existing per-row baseline field; it isn't worth a detour.

### Bill deletion

`src/components/billing/bill-actions.tsx`

A `Delete` action (ghost, danger-tinted, last in the row) with a confirm dialog.

Two decisions worth recording:

- **Paid bills can't be deleted from the UI.** A paid bill is a settled record
  with payments hanging off it; deleting it would take the payment history with
  it. The API permits it (`ModelViewSet` + `BILLING_WRITE_ROLES`); the UI
  declines to offer it. Roles otherwise match the backend exactly, so the button
  never appears where the API would refuse.
- **Deleting an issued bill rewinds the meter.** This is the non-obvious part.
  `enter_reading` advances `meter.current_reading`, and a replacement bill
  derives its `previous_reading` from the meter — so deleting alone would make
  the recreated bill read **0 units consumed**, which is precisely the workflow
  the ask was for. The delete therefore PATCHes the meter back to the bill's
  `previous_reading`, but **only while this bill's reading is still the meter's
  latest** (`meter.current_reading === bill.current_reading`); if a later bill
  has since moved it on, rolling back would corrupt that one instead.
  Delete runs first and the rewind second: a failed rewind is recoverable and
  reported, a rewound meter under a live bill is not.

The dialog says which number the meter will return to, and notes that a bill
already sent leaves the resident holding the old copy.

### Sorting bills by flat

`src/components/billing/bills-table.tsx`

- `flat__flat_number` added to `BILL_SORT_OPTIONS`, first in the list — the flat
  is how bills are looked up.
- The Flat column is now sortable, mapped to `flat__flat_number`.

Server-side ordering; `ElectricityBillViewSet.ordering_fields` already included
the field, so this is a UI affordance over an existing capability.

### Consistency with the server-owned baseline

`src/components/billing/bill-form.tsx`, `src/types/api.ts`

`previous_reading` dropped from `ElectricityBillInput` and from the create
payload. The server anchors every bill to its meter's running value and ignores a
client-sent baseline, so sending one was misleading: it implied the client had a
say. A first-time baseline goes to the meter instead, which is why two clients
creating bills at once can't anchor to different numbers.

---

## What the backend already provides

No backend changes were needed. Verified against `master`:

| Need | Already there |
| --- | --- |
| Delete a bill | `TenantScopedViewSet` is a `ModelViewSet`; `write_roles = BILLING_WRITE_ROLES` |
| Sort by flat number | `ordering_fields` includes `'flat__flat_number'` |
| Bulk-created flats get meters | `FlatViewSet.bulk_create` does `Meter.objects.bulk_create([...])` in the same transaction |
| Bulk reading writes | `MeterViewSet` PATCH on `current_reading` |

## Recommended backend follow-ups

Not blocking, but the frontend is compensating for these:

1. **Deleting a bill should rewind its meter server-side.** The client does it in
   two requests today; a `perform_destroy` override would make it atomic and
   correct for any caller, not just this UI.
2. **Deleting a bill leaves its `MeterReading` row behind.** Reading history
   keeps an entry for a bill that no longer exists. Same `perform_destroy` is the
   place to clear it.
3. **A dedicated bulk-readings endpoint.** N PATCHes work and fail gracefully,
   but one request would be atomic and quicker over a phone connection.
4. **Guard the round against unbillable flats.** `build_round` could flag stops
   whose flat has no apartment type, so the round warns up front instead of
   failing at submission — see the 18 flats above.

## Verification

- `tsc --noEmit` — clean.
- `eslint` on every changed file — clean.
- `/billing/opening-readings` and `/billing/meter-round` compile and serve 200
  with no dev-server errors.
- Database checks in the table above run against the live database.
