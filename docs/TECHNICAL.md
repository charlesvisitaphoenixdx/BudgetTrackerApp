# BudgetTrackerApp — Technical Documentation

## Overview

BudgetTrackerApp is a client-only Progressive Web App (PWA) for tracking
expenses against a user-configurable monthly budget period. "Client-only"
is a deliberate architectural choice: there is no backend/API — all data is
created, read, updated, and persisted directly in the browser.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| UI framework | React 18 | Function components + hooks only, no class components. |
| Build tool | Vite 5 | Fast dev server + production bundling. |
| PWA | `vite-plugin-pwa` (Workbox under the hood) | Generates the web manifest and service worker at build time (`generateSW` mode). |
| Unit tests | Vitest 2 | Chosen for its drop-in Jest-like API and native Vite integration (no separate test bundler config needed). |
| Config-data persistence | `localStorage` | See "Data model" below. |
| Transaction-data persistence | IndexedDB, via the `idb` wrapper library | See `claude/requirements.md` in the project for the decision record. |

No state-management library (Redux/Zustand/etc.) or CSS framework is in
use — plain `useState`/custom hooks and hand-written CSS are sufficient so
far. There's also no routing library: with two screens, `App.jsx` just
keeps a `screen` string in `useState` and conditionally renders one page or
the other, with a couple of nav buttons to switch. Revisit this if the app
grows enough screens to make that unwieldy (e.g. needing deep-linkable
URLs).

## Project structure

```
BudgetTrackerApp/
├── index.html              # Vite entry HTML
├── vite.config.js          # Vite + vite-plugin-pwa config (manifest, icons)
├── package.json
├── public/
│   ├── favicon.svg
│   └── icons/               # PWA manifest icons (192px, 512px)
├── src/
│   ├── main.jsx             # React root render
│   ├── App.jsx              # Top-level: nav between Expenses / Configuration screens
│   ├── App.css               # Component styles (design tokens as CSS custom properties)
│   ├── index.css             # Global reset + light/dark color tokens
│   ├── pages/
│   │   ├── ConfigurationPage.jsx   # Composes the Configuration screen
│   │   └── ExpensesPage.jsx        # Composes the Expenses screen
│   ├── components/
│   │   ├── ExpenseTypesManager.jsx # Expense Types CRUD UI
│   │   ├── PeriodSettings.jsx      # Start-day setting + period preview UI
│   │   ├── Modal.jsx               # Generic dialog: Escape/backdrop-click to close, scroll lock
│   │   ├── ExpenseForm.jsx         # Add/Edit expense form + validation wiring (rendered inside Modal)
│   │   └── ExpenseList.jsx         # Logged-expenses list; click a row to edit, ✕ to delete
│   ├── hooks/
│   │   ├── useLocalStorageState.js # useState, but persisted to localStorage
│   │   └── useExpenses.js          # Loads/add/edit/remove expenses via expensesDb.js
│   └── utils/
│       ├── period.js              # Pure functions: budget-period date math
│       ├── period.test.js
│       ├── expenseValidation.js   # Pure Expense Entry form validation
│       ├── expenseValidation.test.js
│       ├── expensesDb.js          # IndexedDB (idb) access for expense records
│       └── format.js              # Shared amount/date display formatting
└── docs/
    ├── USER_GUIDE.md
    ├── TECHNICAL.md            # this file
    └── qa/                     # dated QA pass reports
```

## Data model (current)

All Configuration data lives in `localStorage` under these keys (see
`useLocalStorageState`):

- `config.expenseTypes` — `Array<{ id: number, name: string, color: string }>`
- `config.startDay` — `number` (1-31)
- `config.previewDate` — `string` (`YYYY-MM-DD`), last-used preview date on
  the Period Settings screen; convenience only, not a "real" setting.

`useLocalStorageState(key, initialValue)` mirrors the `useState` API: it
lazily reads `localStorage` on mount (falling back to `initialValue` if
nothing is stored or storage throws, e.g. in private browsing) and writes
back on every change via a `useEffect`. Reads/writes are wrapped in
try/catch so a storage failure degrades to in-memory-only behavior rather
than crashing the app.

Expense transaction records live in **IndexedDB** (database
`budget-tracker-db`, object store `expenses`, `src/utils/expensesDb.js`),
accessed via the `idb` wrapper:

- `id` (string, `crypto.randomUUID()`) — primary key.
- `expenseTypeId` (number) — references an id in `config.expenseTypes`.
  Deliberately **not** denormalized (no snapshot of the type's name/color
  at entry time): the UI looks up the current type by id at render time,
  and falls back to a "Deleted category" label if the id no longer matches
  anything in Configuration (e.g. the type was deleted after the expense
  was logged). This was a simplicity trade-off for the MVP — see "Known
  limitations" below.
- `amount` (number, rounded to 2 decimal places on save).
- `date` (string, `YYYY-MM-DD`).
- `name` (string, ≤80 chars).
- `description` (string, ≤500 chars, may be empty).
- `createdAt` (ISO timestamp string) — insertion order, used as a
  tie-breaker when sorting same-day expenses.
- `updatedAt` (ISO timestamp string, optional) — set whenever an existing
  record is edited via `updateExpense`; absent on records that have never
  been edited.

`expensesDb.js`'s `updateExpense(id, updates)` reads the existing record,
merges `updates` on top of it (preserving `id` and the original
`createdAt`), stamps `updatedAt`, and `db.put`s the result — it throws if
`id` doesn't match a stored record. `useExpenses()` exposes this as
`editExpense(id, data)`, which also updates the in-memory `expenses` array
in place (`.map`) so the UI reflects the change without a full reload.

Indexes `by-date` and `by-expenseTypeId` are created up front (even though
nothing queries them yet) specifically to avoid an IndexedDB schema
migration (a version bump + `upgrade()` path) later, once period-based
filtering or reporting needs them.

## Budget period calculation (`src/utils/period.js`)

This is the one piece of non-trivial business logic in the app, so it's
kept framework-free (pure functions, no React) and fully unit-tested.

**Concept:** instead of a calendar month, a "budget period" runs from a
configured start day in one month up to (but not including) that same start
day in the next month. Example: start day `5` → the period containing any
date in September runs **Sep 5 → Oct 4**.

**Key functions:**

- `daysInMonth(year, monthIndex)` — day count for a given month
  (`monthIndex` is 0-based, JS `Date` convention).
- `clampDay(year, monthIndex, day)` — clamps a requested day-of-month to
  that month's actual last day (handles start days like 31 in February).
- `addMonthIndex(year, monthIndex, delta)` — month arithmetic with correct
  year rollover in both directions.
- `periodFor(refDate, startDay)` — the core function. Given any date and
  the configured start day, returns `{ start, end }` Dates for the period
  containing that date. Logic: compute the effective (clamped) start day
  for `refDate`'s own month; if `refDate`'s day-of-month is before that,
  the period actually started the *previous* month, so roll back one month
  before clamping and computing `start`; `end` is one day before the
  *next* period's (clamped) start day.
- `shiftPeriod(period, startDay, delta)` — given a period, returns the
  previous (`delta: -1`) or next (`delta: 1`) one, by nudging a probe date
  into the neighboring month (clamped so it doesn't skip a short month) and
  recomputing via `periodFor`.

**Edge cases explicitly covered by tests** (`period.test.js`): the exact
example from the spec, the boundary day immediately before vs. exactly on
the start day, start day `1` behaving like a plain calendar month, a start
day clamped in a non-leap February, a start day clamped across a leap-year
February, and `shiftPeriod` correctness.

If you touch this file, run `npm test` and, ideally, add a case rather than
just trusting the existing ones — date math is exactly the kind of code
where an off-by-one silently ships.

## Component notes

- **`ExpenseTypesManager`**: owns the "add new type" form and its
  validation (empty / duplicate-name checks, case-insensitive). Each
  existing row is rendered by an inner `TypeRow` component that owns its
  *own* local draft state for the name field. This is intentional: an
  earlier version used a single uncontrolled `defaultValue` input per row
  and, on an invalid rename (duplicate or empty), failed silently — the
  field kept showing the invalid text with no error and no revert. See
  `docs/qa/QA-report-2026-09-10.md` for how this was found. `TypeRow` now
  reverts its draft to the last good name and shows an inline error when a
  rename is rejected.
- **`PeriodSettings`**: purely presentational + calls into `period.js`;
  holds no persistence logic of its own (that's the parent page's job via
  `useLocalStorageState`).
- **`ConfigurationPage`**: the composition root for this screen — wires the
  two components above to their respective `localStorage`-backed state.
- **`Modal`**: a small generic dialog — dims the background, closes on
  Escape or a click on the backdrop itself (a `onMouseDown` check that
  `e.target === e.currentTarget`, so clicks inside the panel that bubble up
  don't close it), and locks `document.body`'s scroll for as long as it's
  mounted (restored via its `useEffect` cleanup). Takes `title` (used as
  `aria-label`) and `onClose`; the caller owns the open/closed state and
  conditionally renders `<Modal>` — the component has no internal
  visibility state of its own. Also manages focus: on mount it moves focus
  to the first focusable element inside `.modal-panel` (falling back to the
  panel itself, which carries `tabIndex={-1}`), traps Tab/Shift+Tab so it
  cycles only among the panel's focusable descendants, and on unmount
  restores focus to whatever element had it before the modal opened (the
  trigger button, in practice).
- **`ExpenseForm`**: rendered inside `<Modal>` by `ExpensesPage`, either for
  adding (triggered by "+ Add Expense") or editing (triggered by clicking a
  logged-expense row). A fully controlled form (all fields in one
  `useState` object) that delegates all validation to the pure
  `validateExpense()` function rather than duplicating rules in the
  component. Takes an optional `initialValue` prop — an existing expense
  record — used only to compute the form's initial state
  (`formFromExpense`, which stringifies `expenseTypeId`/`amount` for the
  controlled inputs and defaults `description` to `""`); `isEditing =
  Boolean(initialValue)` then switches the heading ("Add Expense" / "Edit
  Expense") and the submit button's label ("Add Expense"/"Adding…" vs.
  "Update Expense"/"Saving…"). It doesn't otherwise behave differently in
  edit mode — the same `validateExpense()` call runs either way, and
  `onSubmit` (async — awaited, left to the parent to decide what happens on
  success) is called with the same normalized shape regardless of add vs.
  edit; the parent (`ExpensesPage`) is what decides whether that becomes an
  add or an update. Since the component unmounts whenever the modal closes
  (success or Cancel), it doesn't need to reset its own state — a fresh
  mount always starts from either `emptyForm()` or the passed
  `initialValue`. It no longer renders the "no expense types" fallback
  itself; that moved up to `ExpensesPage` since the form is only ever
  rendered once expense types exist. Note that the Amount field's native
  `type="number"` and the Name/Description fields' `maxLength` attributes
  already block a lot of invalid input before `validateExpense` ever sees
  it — its own checks for those cases exist as defense-in-depth (see
  `docs/qa/QA-report-2026-09-10-expense-entry.md`), not because they're
  reachable through the form under normal use.
- **`ExpenseList`**: sorts by date (descending) with `createdAt` as a
  tie-breaker; looks up each record's expense type by id from the current
  `expenseTypes` array (not stored on the record itself — see "Data model").
  Each row renders as a non-interactive `<div className="expense-row">`
  containing two flat, sibling `<button>`s rather than a button nested
  inside a `role="button"` row (an ARIA anti-pattern the previous markup
  had): one button (`.expense-row-select`, styled to fill the row) calls
  the `onSelect` prop with that row's expense record — `ExpensesPage` uses
  this to open the edit modal — and the other is the delete (`✕`) button.
  Because they're siblings rather than nested, clicking delete no longer
  needs `e.stopPropagation()` to avoid also triggering row selection. The
  delete button's `onClick` first asks for confirmation via `window.confirm`
  (deleting is irreversible) and, if confirmed, `await`s `onDelete(exp.id)`
  so a rejected delete doesn't become an unhandled promise rejection;
  `useExpenses`'s `removeExpense` catches storage errors itself and surfaces
  them through the same `error` state used for load failures.
- **`ExpensesPage`**: the composition root for this screen. Reads
  `config.expenseTypes` via `useLocalStorageState` (read-only usage — the
  setter is discarded) so it always reflects Configuration's current state;
  since `App.jsx` unmounts/remounts pages on nav rather than keeping both
  mounted, there's no live-sync concern between the two screens. Tracks two
  independent pieces of state: `showAddModal` (boolean, set by "+ Add
  Expense") and `editingExpense` (the expense record being edited, or
  `null`, set via `ExpenseList`'s `onSelect`); `isModalOpen` is simply
  `showAddModal || Boolean(editingExpense)`, and a single `closeModal()`
  resets both. The modal's `title` and `ExpenseForm`'s `initialValue` are
  both derived from `editingExpense`. `handleSubmit` is the one place that
  branches on which mode is active: if `editingExpense` is set it calls
  `editExpense(editingExpense.id, data)`, otherwise `addExpense(data)`, then
  closes the modal either way — `ExpenseForm` itself has no idea which
  storage operation its `onSubmit` call will trigger. When there are no
  expense types configured, the "+ Add Expense" trigger button is replaced
  by a fallback message + link to Configuration, same as before.

## Styling

Plain CSS (`App.css`, `index.css`), no CSS-in-JS or utility framework.
Colors are defined as CSS custom properties on `:root`, with a
`prefers-color-scheme: dark` override block, so the app follows the
device's light/dark setting automatically without any JS theme toggle.

## Build & development

```bash
npm install        # install dependencies
npm run dev         # start the Vite dev server (hot reload)
npm test            # run the Vitest unit suite
npm run build        # production build to dist/ (also generates the
                      # service worker + manifest via vite-plugin-pwa)
npm run preview      # serve the production build locally, for testing
                      # the built (not dev-mode) app, including PWA bits
```

There is no CI pipeline configured yet (no GitHub Actions workflow) — tests
and the build are currently run manually before pushing.

## PWA configuration

Configured in `vite.config.js` via `VitePWA({...})`:

- `registerType: "autoUpdate"` — the service worker updates itself without
  prompting the user.
- Manifest: name, theme/background colors, `display: "standalone"`, and two
  icon sizes (192px, 512px) generated as simple placeholder PNGs in
  `public/icons/` (replace these with real branded icons before a public
  release).
- Build mode `generateSW` (Workbox generates the service worker; no custom
  `sw.js` is hand-written).

## Testing strategy

- **Unit tests** (Vitest): cover the pure logic modules —
  `src/utils/period.js` (9 tests) and `src/utils/expenseValidation.js`
  (23 tests). Component behavior and storage (localStorage, IndexedDB) are
  verified via scripted browser testing (see QA reports) rather than
  component tests (e.g. React Testing Library) — that may be worth adding
  once components have more conditional logic worth locking down.
- **QA passes**: ad hoc, dated reports live under `docs/qa/`. These are
  produced by scripting a real Chromium browser (Playwright) against the
  production build (`npm run build && npm run preview`) — clicking,
  typing, reloading — rather than only reading the code. Each report lists
  every test case run and its pass/fail result, plus any bugs found and
  their fixes. Each new feature's QA script re-runs the full suite of prior
  cases alongside the new ones, as a regression check (see
  `docs/qa/QA-report-2026-09-11-expense-edit.md` for the most recent
  example: 34 regression cases + 11 new click-to-edit cases, 45/45 passed).

## Known limitations / open items

- No cross-device sync — data is local to one browser/device
  (by design, per the project's local-first persistence requirement).
- No automated component/UI test suite yet (see above).
- No CI configured.
- Placeholder PWA icons — functional but not branded.
- Expense Types currently only have `name` + `color`; no icon, limit, or
  active/inactive fields (explicit scope decision, see
  `claude/requirements.md`).
- Expenses aren't yet connected to the configured Budget Period Start Day:
  there's no filtering, totals, or reporting by period yet.
- No currency or locale handling: amounts are plain fixed-point numbers
  (`12.50`), with no currency symbol or thousands separator.
- An expense stores only `expenseTypeId`, not a snapshot of that type's
  name/color — if the type is renamed later, past expenses show the new
  name; if it's deleted, they show "Deleted category". This was a
  simplicity trade-off for the MVP; revisit if historical accuracy (keeping
  the name/color as they were at entry time) turns out to matter.

## Where decisions are tracked

Product requirements and architecture decisions (tech stack, storage
choices, module scope) are logged in the `claude/requirements.md` project
doc rather than duplicated here — check there for the "why", and this file
for the "how it's built".
