# BudgetTrackerApp

A Progressive Web App (PWA) for tracking budgets against a custom monthly
budget period.

**Live app:** https://charlesvisitaphoenixdx.github.io/BudgetTrackerApp/ —
open this on a phone and use the browser's "Add to Home Screen" (iOS
Safari) or "Install app" (Android Chrome) to install it. Auto-deploys from
`main` via GitHub Actions (`.github/workflows/deploy-pages.yml`); see
"Deployment" below.

## Stack

- React 18 + Vite
- `vite-plugin-pwa` for the installable/offline PWA bits (manifest + service
  worker)
- Vitest for unit tests
- `localStorage` for configuration data, IndexedDB (via `idb`) for expense
  records

## Configuration module

Implemented under `src/pages/ConfigurationPage.jsx`:

- **Expense Types** — categories used to tag expenses (name + color). Add,
  rename, or remove types. Persisted to `localStorage`.
- **Budget Period Start Day** — instead of a plain calendar month, the
  budget period can start on any configured day of the month. For example,
  a start day of `5` means September's period runs **Sep 5 → Oct 4**. If the
  configured day doesn't exist in a given month (e.g. `31` in February), it
  is clamped to that month's last day. The period math lives in
  `src/utils/period.js` and is covered by tests in `src/utils/period.test.js`.

## Expense Entry module

Implemented under `src/pages/ExpensesPage.jsx`:

- A "+ Add Expense" button opens the entry form in a modal (Add Expense /
  Cancel). Expense Type, Amount, Date, and Name are required; Description
  is optional. Validated in `src/utils/expenseValidation.js` (unit-tested).
- View logged expenses (most recent first). Click an entry to reopen the
  same modal, pre-filled, and update it (Update Expense / Cancel); click
  the ✕ button, then confirm, to delete it. Persisted to IndexedDB via
  `src/utils/expensesDb.js`.

## Development

```bash
npm install
npm run dev       # start dev server
npm test          # run unit tests
npm run build     # production build (also generates the service worker)
npm run preview   # preview the production build locally
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy-pages.yml`: install, `npm
test`, `npm run build` (with `GITHUB_PAGES=true` so Vite emits asset paths
under `/BudgetTrackerApp/`, matching where GitHub Pages serves a project
repo), then publish `dist/` via GitHub's official Pages Actions. One-time
setup required in the repo's GitHub settings: **Settings → Pages → Build
and deployment → Source: "GitHub Actions"** (can't be set from the
command line). After that, every push to `main` redeploys automatically —
no manual build/upload step.

## Documentation

- [User Guide](docs/USER_GUIDE.md) — how to use the app.
- [Technical Documentation](docs/TECHNICAL.md) — architecture, data model,
  and developer notes.
- [QA reports](docs/qa/) — dated test-pass reports.

_Repository initialized by Claude — ready for development._
