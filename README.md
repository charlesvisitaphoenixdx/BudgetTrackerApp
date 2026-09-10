# BudgetTrackerApp

A Progressive Web App (PWA) for tracking budgets against a custom monthly
budget period.

## Stack

- React 18 + Vite
- `vite-plugin-pwa` for the installable/offline PWA bits (manifest + service
  worker)
- Vitest for unit tests

## Configuration module

The first module of the app, implemented under `src/pages/ConfigurationPage.jsx`:

- **Expense Types** — categories used to tag expenses (name + color). Add,
  rename, or remove types. Persisted to `localStorage`.
- **Budget Period Start Day** — instead of a plain calendar month, the
  budget period can start on any configured day of the month. For example,
  a start day of `5` means September's period runs **Sep 5 → Oct 4**. If the
  configured day doesn't exist in a given month (e.g. `31` in February), it
  is clamped to that month's last day. The period math lives in
  `src/utils/period.js` and is covered by tests in `src/utils/period.test.js`.

## Development

```bash
npm install
npm run dev       # start dev server
npm test          # run unit tests
npm run build     # production build (also generates the service worker)
npm run preview   # preview the production build locally
```

_Repository initialized by Claude — ready for development._
