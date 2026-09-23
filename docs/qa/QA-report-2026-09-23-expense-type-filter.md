# QA Report — 2026-09-23 — Expense Type Filter (Expenses screen)

## Scope

Extends the already-QA'd Expense List Filtering feature
(`QA-report-2026-09-23-expense-list-filtering.md`) with a fourth filter
dimension: expense type/category, per "Addendum (2026-09-23): Filter by
expense type" at the end of `docs/requirements.md`'s "Feature: Expense List
Filtering" section, and Story 26 in `docs/user-stories.md`. Also re-verifies
Story 25 (combine/clear/cross-screen isolation) and the collapsible-accordion
behavior from the prior increment now that a fourth field lives inside it.
New/changed source: `src/utils/expenseFilter.js` (`expenseTypeId` dimension),
`src/utils/expenseFilter.test.js` (5 new cases), `src/components/
ExpenseFilters.jsx` (new dropdown + `expenseTypes` prop), `src/pages/
ExpensesPage.jsx` (passes `expenseTypes` down, new deleted-type-reset
`useEffect`). `src/pages/DashboardPage.jsx` was not touched by this change —
confirmed by diff inspection and re-verified live (TC-19 below).

## Method

Standard project convention: `npm test`, then `npm run build && npm run
preview -- --port 4173`, driven headlessly with Chromium via Playwright
against the served production build — real clicks/typing/navigation, not
just reading the code. Playwright (not a project dependency) was already
cached on this machine (`playwright` npm package `v1.63.0` under the local
npx cache, `ms-playwright/chromium-1243`) — nothing new was installed;
required by an absolute `require()` path to the cached package since it
isn't in this project's `node_modules`. Script: `qa_expense_type_filter.cjs`
(session scratchpad).

The run started from a clean slate (`localStorage.clear()` +
`indexedDB.deleteDatabase("budget-tracker-db")`) before seeding all test
data through the real UI (Add Expense form, Configuration screen) — nothing
was written directly into storage. A single deterministic dataset (6
expenses across the 5 seed categories plus Transport, all through the real
Add Expense form) was reused for driving the UI and computing expected
results:

| Name | Type | Amount | Date | Description |
|---|---|---|---|---|
| Coffee run | Groceries | 4.50 | 2026-09-10 | — |
| Groceries haul | Groceries | 82.30 | 2026-09-05 | "Weekly shop, bought coffee beans" |
| Rent payment | Rent | 1200.00 | 2026-09-01 | — |
| Movie night | Entertainment | 25.00 | 2026-08-20 | "popcorn and tickets" |
| Wildcard *test* item | Utilities | 1.00 | 2026-09-12 | — |
| Bus pass | Transport | 20.00 | 2026-09-08 | — |

A Monthly Budget Limit of 1000.00 was set in Configuration so the
Dashboard's over/under indicator would be non-trivial for the regression
checks against it (September total across all 5 in-period expenses:
1,307.80 — over by 307.80).

This pass re-runs the **full case list** from
`QA-report-2026-09-23-expense-list-filtering.md` (date range, amount range,
search, combine/clear, empty-state messaging, reset-on-navigation) against
the new 6-expense dataset, plus the new expense-type dimension's own cases,
the accordion-with-a-4th-field regression, the deleted-selected-type edge
case, and the Dashboard-isolation critical checks — all as one combined
suite, per this project's "every QA pass re-runs the full prior regression
suite" convention.

**Note on the deleted-selected-type edge case (TC-11 → TC-14):** reaching
Configuration to delete a type requires navigating away from the Expenses
screen, and `App.jsx` conditionally *unmounts* `ExpensesPage` on every
screen switch (confirmed by reading `App.jsx`) — so the Expenses screen's
`filters` state (and therefore its `expenseTypeId` selection) is already
discarded by the plain remount before the new `useEffect` fallback would
ever need to fire, exactly as already true for `DashboardPage`'s equivalent,
existing effect (its `expenseTypes` is likewise fixed for the life of a
mount — the setter is discarded — so its own reset effect is dead code
under the current navigation model too). This pass verifies the
**user-observable behavior** Story 26 actually specifies — the filter has
reset and the dropdown offers no stale option — which holds true, but that
observation doesn't distinguish "the fallback effect fired" from "the
screen simply remounted." This is a pre-existing characteristic of the
app's screen-switching architecture, not a defect introduced by this
change, and not worth a design change on its own — flagging it here for
the record rather than overclaiming the effect was independently exercised.

## Results

**Unit tests:** 55/55 passed — `period.test.js` (9), `expenseFilter.test.js`
(23, 5 new for the `expenseTypeId` dimension), `expenseValidation.test.js`
(23). No regressions (baseline before this addendum was 50/50).

**Production build:** succeeded with no errors (50 modules, PWA precache 8
entries / 179.91 KiB).

**Playwright suite: 32/32 test cases passed** after two script-side fixes
made mid-pass (see "Bugs found" — both were wrong expected values in the
test script itself, not application defects). Zero browser console errors
or uncaught exceptions.

| ID | Case | Result |
|----|------|--------|
| SETUP-1 | All 6 seeded expenses appear, most-recent-date-first | PASS |
| TC-20 | Filters accordion starts collapsed on a fresh mount | PASS |
| TC-21 | Expense-type dropdown shows "All types" + one option per configured type | PASS |
| TC-22 | Selecting a type narrows the list to only that type's expenses | PASS |
| TC-23 | Type filter combines with AND alongside an amount filter | PASS |
| TC-24 | Switching back to "All types" removes only that constraint, others remain active | PASS |
| TC-25 | "Clear filters" resets the type dropdown to "All types" along with the rest | PASS |
| TC-26 | Selecting a type shows the "Active" badge, including while collapsed | PASS |
| TC-27 | The inline Clear-filters link (visible while collapsed) works | PASS |
| TC-1 | Unfiltered list shows all 6 expenses, most-recent-date-first | PASS |
| TC-2 | Date range (From+To, inclusive) narrows correctly | PASS |
| TC-3 | An inverted date range (From after To) shows zero matches, no error | PASS |
| TC-4 | Amount range (Min+Max, inclusive) matches only expenses within it | PASS |
| TC-5 | Search matches name-or-description, case-insensitively | PASS |
| TC-6 | Literal `*`/`?` are treated as plain characters, not glob wildcards | PASS |
| TC-7 | All active filter dimensions (incl. expense type) combine with AND, not OR | PASS |
| TC-8 | "Clear filters" resets every input (all 4 dimensions) and restores the full list | PASS |
| TC-9 | Zero-matches empty state reads "No expenses match these filters." | PASS |
| TC-10 | All 4 filter dimensions reset when the Expenses screen is left and re-entered | PASS |
| TC-11 | Deleted-type edge case setup: select Transport in the Expenses filter | PASS |
| TC-12 | Delete the Transport expense type in Configuration | PASS |
| TC-13 | Filter shows "All types" after its selected type is deleted (not stuck on a stale id); no stale option offered | PASS |
| TC-14 | "All types" still includes the now-orphaned expense, labeled "Deleted category" | PASS |
| TC-15 | Set an active Expenses-screen type filter, then navigate to the Dashboard | PASS |
| **TC-16** | **Critical regression:** Dashboard's Selected Period total (1,307.80) is completely unaffected by the Expenses-screen filter active moments before navigating | **PASS** |
| **TC-17** | **Critical regression:** Dashboard's over/under indicator ("over budget," 307.80 over) computes correctly, unrelated to the Expenses filter | **PASS** |
| **TC-18** | **Critical regression:** Dashboard's By Category breakdown (Groceries/Rent/Utilities/Deleted category) is unaffected by the Expenses filter | **PASS** |
| **TC-19** | **Critical regression:** Dashboard's own, separate expense-type filter (`#dashboardFilter`) is untouched by this change — its option list, and the Budget group's total, are unaffected by selecting a type there | **PASS** |
| TC-28 | Expenses-screen filters (incl. expense type) reset to empty after the Dashboard round trip | PASS |
| TC-29 | Regression: editing a logged expense still works | PASS |
| TC-30 | Regression: deleting a logged expense still works | PASS |
| CONSOLE | Zero console errors/uncaught exceptions across the entire pass | PASS |

## Bugs found

**Application bugs: none.**

**Script-side issues (found and fixed during this pass, not application
defects):**
1. The initial seeded-list ordering assertion and the date-range test's
   expected order both mis-sorted "Bus pass" (2026-09-08) relative to
   "Groceries haul" (2026-09-05) — the app's actual most-recent-first
   output was correct; the test's hardcoded expectation was wrong. Fixed.
2. The amount-range test (`Min=20, Max=82.30`) omitted "Movie night"
   (25.00) from its expected match set, even though it falls inside that
   range — an oversight in the test data, not the app's filtering logic
   (confirmed correct once the expectation was fixed). Because the
   assertion threw before the script's own field-clearing cleanup line
   ran, this also left stale `minAmount`/`maxAmount` values active for the
   next two cases, causing two further, purely downstream script failures
   (search and wildcard cases) with no independent bug of their own. Fixed
   by (a) correcting the expected set and (b) restructuring every
   dimension-specific case to call a shared `resetAllFilterFields()` at
   its start rather than relying on the previous case's cleanup running —
   makes cases independent of run order/prior failures.

## Conclusion

The expense-type filter dimension works exactly as specified in
`docs/requirements.md`'s Addendum and Story 26: the dropdown lists "All
types" plus the currently configured types, narrows the list correctly,
combines with the other three dimensions via AND, resets via "Clear
filters" or on navigation, and — once its selected type is deleted — the
filter and its option list both behave as if reset to "All types," with
the now-orphaned expense still visible and labeled "Deleted category"
under that default. The accordion collapse/expand and "Active"-badge
behavior from the prior increment continue to work correctly with a
fourth field inside it. Most importantly, this feature's core
architectural promise — that it's entirely local to the Expenses screen
and never affects the Dashboard's totals, indicator, category breakdown,
or its own separate type filter — is confirmed live, not just by code
inspection. No regressions found in the original three filter dimensions
or in expense CRUD. Safe to ship; `docs/TECHNICAL.md`'s "Extended,
2026-09-23 (not yet QA-verified)" note for this dimension should be
updated to point at this report now that it has been verified live.
