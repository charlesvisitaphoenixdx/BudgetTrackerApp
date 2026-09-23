# QA Report — 2026-09-23 — Spending Dashboard (retroactive live pass)

## Why this report exists

The **Spending Dashboard** feature (`docs/requirements.md` "Feature: Spending
Dashboard") — the 6-period Spending Trend, Top Categories ranking, and the
expense-type filter, plus merging the standalone Budget screen into
`DashboardPage.jsx` — shipped on 2026-09-11 (commits `a29c3d3`, `c191047`).
Its commit messages claim live verification ("15/15 assertions... verified
live against `vite preview`"), but unlike every other feature in this
project, no corresponding dated report was ever produced under `docs/qa/`.
That gap was found during a full repo review on 2026-09-23. Per this
project's own QA discipline (a claim of "verified" must be backed by a
durable, checkable report, not a commit message), this pass closes it by
actually re-running a live verification now, rather than writing a report
describing a pass that was never really documented.

The 2026-09-15 Dashboard/Budget Section Split (`QA-report-2026-09-15-dashboard-budget-split.md`)
already re-verified the Budget-group/filter-decoupling behavior thoroughly
(20/20). This pass focuses on the Spending Dashboard items that report
didn't specifically target — the 6-period trend's contents and ordering,
Top Categories' ranking/percentage math, and the "Deleted category"
grouping in that context — plus a light regression pass.

## Scope

Covers `docs/user-stories.md` Stories 13 and 14 (Spending Trend, Top
Categories) and the relevant parts of Story 16/18 (type filter, filter
reset on type deletion — reconfirmed as unaffected by the later split), and
`docs/requirements.md`'s "Feature: Spending Dashboard" in-scope items
2-4 and its Edge cases section.

## Method

Standard project convention: `npm test`, then a production build served via
`vite preview`, driven headlessly with Chromium via Playwright — real
clicks, form fills, and navigation through the actual UI, not direct
storage writes. Playwright (not a project dependency) was already cached on
this machine from a prior session (`ms-playwright/chromium-1243`, and the
`playwright` npm package itself loaded from the local npx cache,
`v1.63.0`), so nothing new was installed. Script:
`qa_spending_dashboard.cjs` (session scratchpad).

The run started from a clean slate (`localStorage.clear()` +
`indexedDB.deleteDatabase("budget-tracker-db")`) before seeding all test
data through the real UI. A single deterministic dataset was built and
reused both to drive the UI and to independently compute every expected
trend/ranking value in the script itself (rather than hand-calculating
expected numbers), so pass/fail is a direct comparison against the same
aggregation logic the app implements, not a hand-checked guess:

| Date | Type | Amount |
|---|---|---|
| 2026-05-10 | Groceries | 100.00 |
| 2026-06-05 | Transport | 50.00 |
| 2026-07-12 | Groceries | 80.00 |
| 2026-07-20 | Utilities | 20.00 |
| 2026-08-08 | Rent | 300.00 |
| 2026-09-05 | Groceries | 60.00 |
| 2026-09-10 | Entertainment | 40.00 |
| 2026-09-15 | *ToDelete* (temporary type, deleted after seeding) | 10.00 |

(April 2026 was left with zero expenses, deliberately, to exercise the
zero-spend-period and "less than 6 real periods of history" edge cases in
the same fresh-install run.)

## Results

**Unit tests:** 32/32 passed (`period.test.js` 9, `expenseValidation.test.js`
23) — unaffected by this pass, no regressions.

**Production build:** succeeded with no errors (`vite build`, 48 modules,
PWA precache 8 entries / 175.82 KiB).

**Playwright suite: 21/21 test cases passed** (after two script-side fixes
made mid-session — see "Script bugs found," not application bugs). Zero
browser console errors or uncaught exceptions across the entire run.

| ID | Case | Result |
|----|------|--------|
| SETUP-1 | All 8 seed expenses added via the real Expenses UI with no console errors | PASS |
| TC-D1 | Filter dropdown lists "All types" + the 5 live types; the deleted type is not offered | PASS |
| TC-D2 | Spending Trend renders exactly 6 rows | PASS |
| TC-D3 | Trend rows are ordered oldest → newest (Apr..Sep) | PASS |
| TC-D4 | Each trend row's total matches the expected per-period sum (Sep row correctly includes the since-deleted-type expense) | PASS |
| TC-D5 | A period with no history before it existed in this fresh install (Apr) still renders its own $0.00 row rather than being omitted — also stands in for the "fewer than 6 real periods" edge case, since this is a brand-new install | PASS |
| TC-D6 | Bar widths are proportional to the max period in the window (max period = 100%, zero-spend period = 0%) | PASS |
| TC-D7 | Top Categories ranks all 6 groups (5 live types + Deleted category) descending by spend | PASS |
| TC-D8 | Top Categories amounts match expected per-category totals | PASS |
| TC-D9 | Top Categories percentages match expected share of the 6-period grand total | PASS |
| TC-D10 | The since-deleted type's expense groups under a "Deleted category" row in Top Categories | PASS |
| TC-D11 | Selecting a specific type (Groceries) narrows Spending Trend to that type's per-period totals only | PASS |
| TC-D12 | Top Categories is hidden while a single type is selected | PASS |
| **TC-D13** | **Critical regression:** Budget group's Selected Period total stays the all-types total even while the Widgets filter is set to Groceries | **PASS** |
| **TC-D14** | **Critical regression:** By Category card still renders (not hidden) while the type filter is set to a specific type | **PASS** |
| TC-D15 | Switching back to "All types" restores unfiltered Spending Trend totals | PASS |
| TC-D16 | Switching back to "All types" makes Top Categories reappear | PASS |
| TC-D17 | Regression: editing a logged expense's amount is reflected in the Spending Trend total for its period | PASS |
| TC-D18 | Regression: deleting a logged expense removes it from the Spending Trend total for its period | PASS |
| TC-D19 | Regression: a category with zero remaining spend (Transport, after its only expense is deleted) drops out of Top Categories entirely, rather than showing a $0.00 row | PASS |
| CONSOLE | Zero browser console errors/uncaught exceptions across the entire pass | PASS |

TC-D13/TC-D14 are called out as critical because they re-confirm the
Dashboard/Budget Section Split's central invariant (Story 20) still holds
under Spending-Dashboard-specific conditions this pass adds (a live
type-deletion mid-session, an edited/deleted expense) that the 2026-09-15
report's own dataset didn't happen to exercise.

## Script bugs found (not application bugs)

- An early revision of the test script used an ambiguous
  `button:has-text("Add Expense")` selector that matched both the "+ Add
  Expense" trigger and the modal's submit button, causing a timeout. Fixed
  by scoping the submit click to `.modal-panel button[type="submit"]`.
- "By Category" (Budget group) and "Top Categories" (Widgets group) render
  with the same `.budget-breakdown-row`/`.budget-breakdown-label`/
  `.budget-breakdown-amount` classes, so an unscoped query returned both
  sections' rows concatenated. Fixed by scoping queries to the `section.card`
  containing the "Top Categories" heading.
- The initial assertion assumed `fmt()`'s date output is month-first
  ("Apr 1, 2026"); in this environment's locale, `toLocaleDateString(undefined, ...)`
  actually renders day-first ("1 Apr 2026"). This is expected,
  locale-dependent behavior (the app deliberately doesn't pin a locale — see
  `docs/TECHNICAL.md` "no currency/locale handling"), not a bug — the
  assertion was corrected to check for month-name presence rather than
  string position.

No application bugs were found.

## Conclusion

The Spending Dashboard feature — 6-period trend, Top Categories ranking and
percentages, the expense-type filter, and the "Deleted category" grouping
convention applied in this context — works exactly as specified in
`docs/requirements.md` and `docs/user-stories.md`, confirmed via a real
scripted-browser pass rather than a code read. Combined with the existing
2026-09-15 report's coverage of the Budget-group/filter-decoupling
behavior, this closes the QA-paper-trail gap for the feature: it now has a
dated report, not just a commit-message claim. Safe to consider shipped and
verified.
