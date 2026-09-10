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
| Config-data persistence | `localStorage` | See "Data persistence" below. |
| Transaction-data persistence (planned) | IndexedDB, via the `idb` wrapper library | Not yet implemented — see `claude/requirements.md` in the project for the decision record. |

No state-management library (Redux/Zustand/etc.), routing library, or CSS
framework is in use — the app is currently a single screen, so plain
`useState`/custom hooks and hand-written CSS are sufficient. Revisit this if
the app grows enough screens/routes to need one.

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
│   ├── App.jsx              # Top-level component (currently just renders ConfigurationPage)
│   ├── App.css               # Component styles (design tokens as CSS custom properties)
│   ├── index.css             # Global reset + light/dark color tokens
│   ├── pages/
│   │   └── ConfigurationPage.jsx   # Composes the Configuration screen
│   ├── components/
│   │   ├── ExpenseTypesManager.jsx # Expense Types CRUD UI
│   │   └── PeriodSettings.jsx      # Start-day setting + period preview UI
│   ├── hooks/
│   │   └── useLocalStorageState.js # useState, but persisted to localStorage
│   └── utils/
│       ├── period.js          # Pure functions: budget-period date math
│       └── period.test.js     # Vitest unit tests for period.js
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

- **Unit tests** (Vitest): currently cover `src/utils/period.js` only,
  since it's the only module with non-trivial pure logic. Component
  behavior has so far been verified via manual/scripted browser testing
  (see QA reports) rather than component tests (e.g. React Testing
  Library) — that may be worth adding once components have more
  conditional logic worth locking down.
- **QA passes**: ad hoc, dated reports live under `docs/qa/`. These are
  produced by scripting a real Chromium browser (Playwright) against the
  production build (`npm run build && npm run preview`) — clicking,
  typing, reloading — rather than only reading the code. Each report lists
  every test case run and its pass/fail result, plus any bugs found and
  their fixes.

## Known limitations / open items

- No cross-device sync — data is local to one browser/device
  (by design, per the project's local-first persistence requirement).
- No automated component/UI test suite yet (see above).
- No CI configured.
- Placeholder PWA icons — functional but not branded.
- Expense Types currently only have `name` + `color`; no icon, limit, or
  active/inactive fields (explicit scope decision, see
  `claude/requirements.md`).
- IndexedDB migration for transaction data (planned for the Expense
  Tracking module) has not started; `localStorage` remains config-only.

## Where decisions are tracked

Product requirements and architecture decisions (tech stack, storage
choices, module scope) are logged in the `claude/requirements.md` project
doc rather than duplicated here — check there for the "why", and this file
for the "how it's built".
