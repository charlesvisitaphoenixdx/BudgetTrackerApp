# QA Report — 2026-09-23 — Expense List Filtering

## Scope

New feature: a Filters section on the Expenses screen (date range, amount
range, name/description search), specified in `docs/requirements.md`'s
"Feature: Expense List Filtering" and covering Stories 22-25 in
`docs/user-stories.md`. New/changed source: `src/utils/expenseFilter.js`,
`src/components/ExpenseFilters.jsx`, `src/pages/ExpensesPage.jsx`,
`src/components/ExpenseList.jsx` (new `emptyMessage` prop). Reviewed and
approved by `budgettracker-tech-lead` prior to this pass (architecture,
composition-root/presentational split, zero `DashboardPage.jsx` impact,
no new dependency — all confirmed against the diff, not just the stated
intent).

## Method

Standard project convention: `npm test`, then `npm run build && npm run
preview`, driven headlessly with Chromium via Playwright against the
served production build — real clicks/typing/navigation, not just reading
the code. Playwright (not a project dependency) was already cached on this
machine (`ms-playwright/chromium-1243`, `playwright` npm package `v1.63.0`
loaded from the local npx cache) — nothing new was installed. Script:
`qa_expense_filters.cjs` (session scratchpad).

The run started from a clean slate (`localStorage.clear()` +
`indexedDB.deleteDatabase("budget-tracker-db")`) before seeding all test
data through the real UI. A single deterministic dataset (5 expenses
across 3 categories, one dated in the prior budget period) was reused for
both driving the UI and computing expected filter results:

| Name | Type | Amount | Date |
|---|---|---|---|
| Coffee run | Groceries | 4.50 | 2026-09-10 |
| Groceries haul (desc: "...bought coffee beans") | Groceries | 82.30 | 2026-09-05 |
| Rent payment | Rent | 1200.00 | 2026-09-01 |
| Movie night (desc: "popcorn and tickets") | Entertainment | 25.00 | 2026-08-20 |
| Wildcard *test* item | Utilities | 1.00 | 2026-09-12 |

A Monthly Budget Limit of 1000.00 was also set in Configuration, so the
Dashboard's over/under indicator would be non-trivial for the regression
check against it.

Given this feature is additive and structurally isolated to
`ExpensesPage`/`ExpenseList`/the two new files (confirmed by the tech-lead
review's diff inspection — `DashboardPage.jsx` untouched, no shared
state), this pass re-runs a **targeted regression subset** rather than the
full historical suite: CRUD (edit/delete) on the Expenses screen with the
new prop wiring in place, and — most importantly — a direct check that the
Dashboard's totals/indicator/breakdown are completely unaffected by an
Expenses-screen filter that was active immediately before navigating
there. The full historical Dashboard/Budget-split regression suite
(20 cases) was already re-verified twice this month
(`QA-report-2026-09-15-dashboard-budget-split.md`,
`QA-report-2026-09-23-spending-dashboard-retroactive.md`) and this feature
doesn't touch any of that code.

## Results

**Unit tests:** 50/50 passed — `period.test.js` (9), `expenseFilter.test.js`
(18, new), `expenseValidation.test.js` (23). No regressions.

**Production build:** succeeded with no errors (50 modules, PWA precache 8
entries / 178.30 KiB).

**Playwright suite: 22/22 test cases passed**, first run, no script bugs
this time. Zero browser console errors or uncaught exceptions.

| ID | Case | Result |
|----|------|--------|
| TC-0 | Zero-expenses empty state reads "No expenses logged yet." (not the filtered-message variant) | PASS |
| TC-1 | Unfiltered list shows all 5 expenses, most-recent-date-first | PASS |
| TC-2 | Date range (From+To, inclusive) narrows correctly, in date-desc order | PASS |
| TC-3 | Date range with only "To" set matches everything on or before it | PASS |
| TC-4 | An inverted date range (From after To) shows zero matches with the correct empty-state message, no error | PASS |
| TC-5 | Amount range (Min+Max, inclusive) matches only expenses within it | PASS |
| TC-6 | Amount range with only "Min" set matches everything at or above it | PASS |
| TC-7 | An inverted amount range (Min above Max) matches nothing | PASS |
| TC-8 | Search matches name-or-description, case-insensitively | PASS |
| TC-9 | Literal `*`/`?` in the search box are treated as plain characters, not glob wildcards | PASS |
| TC-10 | Whitespace-only search applies no constraint | PASS |
| TC-11 | All active filter dimensions combine with AND, not OR | PASS |
| TC-12 | "Clear filters" resets every input to empty and restores the full, correctly-ordered list | PASS |
| TC-13 | Filters reset to empty when the Expenses screen is left and re-entered (not persisted) | PASS |
| **TC-14** | **Critical regression:** Dashboard's Selected Period total (1,287.80) is completely unaffected by an Expenses-screen search filter active moments before navigating away | **PASS** |
| **TC-15** | **Critical regression:** Dashboard's over/under indicator ("over budget," 287.80 over) computes correctly, unrelated to the Expenses filter | **PASS** |
| **TC-16** | **Critical regression:** Dashboard's By Category breakdown correctly reflects only in-period categories (Groceries, Rent, Utilities), unaffected by anything on the Expenses screen | **PASS** |
| TC-17 | Filters remain reset after visiting Dashboard and returning | PASS |
| TC-18 | Regression: editing a logged expense still works with the new `ExpenseList`/`emptyMessage` prop wiring | PASS |
| TC-19 | Regression: deleting a logged expense still works | PASS |
| CONSOLE | Zero console errors/uncaught exceptions across the entire pass | PASS |

## Bugs found

None. All 22 scripted cases passed on the first fully-instrumented run.

## Conclusion

The Expense List Filtering feature works exactly as specified in
`docs/requirements.md` and `docs/user-stories.md` (Stories 22-25): date
range, amount range, and name/description search all apply correctly
(including inclusive boundaries and inverted-range-yields-empty
behavior), combine with AND logic, and reset cleanly via "Clear filters"
or on navigation away. Most importantly, the feature's core architectural
promise — that it's entirely local to the Expenses screen and never
affects the Dashboard's totals, indicator, or category breakdown — is
confirmed live, not just by code inspection. No regressions found in
expense CRUD. Safe to ship; `docs/TECHNICAL.md`'s "Known limitations"
bullet for this feature is flipped to "(Resolved)" in the same commit as
this report.
