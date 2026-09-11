# QA Report — 2026-09-11 — Live Verification Pass (Budget Period Spending Summary)

## Scope

Follow-up to `QA-report-2026-09-11-budget-period-spending-summary.md`, which
was a **static code review only** (Node/npm/git were unavailable in that
environment). Node and npm are available in this environment, so this pass
runs the project's normal live QA process against that same feature — the
**Budget** screen (`src/pages/BudgetPage.jsx`), the **Monthly Budget Limit**
Configuration setting (`src/components/BudgetLimitSettings.jsx`), and the
third top-nav button (`src/App.jsx`, `src/pages/ConfigurationPage.jsx`) — and
closes out that report's "Needs live verification" list item by item.

## Method

Same convention as `QA-report-2026-09-11-post-audit-fixes.md`: unit tests,
production build, then the production bundle served via `vite preview`
(port 4173) and driven headlessly with Chromium via Playwright (installed
on demand with `npx playwright install chromium`, since it isn't a project
dependency), rather than `npm run dev`, for build-parity with what actually
ships. Three scripts were used (session scratchpad, not part of the repo):
one end-to-end scenario script covering the full list below, plus two small
targeted scripts for the two prior-report bugs (decimal-place validation,
and malformed-storage resilience).

**Coordination note:** `src/components/BudgetLimitSettings.jsx` was being
edited concurrently by another agent while this pass ran. Its two
prior-reported bugs (below) were observed already fixed in the file at the
time of this test run — this is a snapshot at that point in time, not a
guarantee the file hasn't changed since.

## Results

**Unit tests:** 32/32 passed, unchanged from the prior report's expectation
(`src/utils/period.test.js` — 9, `src/utils/expenseValidation.test.js` —
23). No new test files exist for the budget aggregation logic
(`src/pages/BudgetPage.jsx`'s inline `useMemo`s) — same informational gap
the prior report flagged (its Bug/Risk #5), still open, not blocking.

**Build:** `vite build` succeeded — production bundle + PWA precache (8
entries, 172.08 KiB) generated with no errors or warnings.

**Dynamic pass:** 13/13 scripted assertions passed against the served
production build, plus 2 additional targeted checks for the prior report's
Bug #1 and Bug #2 (both now fixed — see below). Zero browser console errors
and zero uncaught page exceptions during the entire pass.

| # | Scenario | Result |
|---|---|---|
| 1 | No-budget-set state: correct copy, $0.00 total, empty-breakdown message | PASS |
| 2 | Total spent = sum of current-period expenses across categories | PASS |
| 3 | Per-category breakdown renders one row per category with spend | PASS |
| 4 | Expense whose type was deleted groups under "Deleted category" subtotal | PASS |
| 5 | **Boundary case:** spend exactly equal to the limit reads as **under** budget (not over), "0.00 remaining" | PASS |
| 6 | Over-budget state: red status, correct over-amount, distinct computed color vs. under/text | PASS |
| 7 | Monthly Budget Limit persists across a full page reload | PASS |
| 8 | Previous-period navigation shows the correct prior period and its expense total | PASS |
| 9 | "Back to current period" returns exactly to the original current period | PASS |
| 10 | Next-period navigation shows the correct following period and its expense total | PASS |
| 11 | No console/page errors across the whole scripted pass | PASS |
| 12 | Dark-mode spot check: over-budget indicator's computed background is visibly distinct from the body background in a dark-scheme context | PASS |

Boundary case (#5) detail: with total spend at $100.00 and the limit set to
exactly $100.00, the page showed `.budget-status-under` (not `-over`) with
text "100.00 of 100.00 — 0.00 remaining" — confirms `totalSpent <= overall`
is genuinely inclusive at runtime, not just in the source trace.

Deleted-category grouping (#4) detail: an expense tagged to "Entertainment"
remained after that type was removed in Configuration; back on the Budget
screen it correctly re-grouped under a single "Deleted category" row
showing its own amount ($20.00), alongside the two still-existing
categories — 3 rows total, not 4, confirming the single-map-key collapsing
behavior traced in the prior report.

## Prior report's two code-level bugs — now confirmed fixed live

### Bug #1 (`BudgetLimitSettings.jsx` missing optional chaining) — FIXED, confirmed live

Manually set `localStorage["config.budgetLimits"]` to a bare `null` (not
the documented `{overall: ...}` shape) and reloaded. The Configuration
screen rendered normally, the budget limit field was present, and there
were zero page errors. The current source now reads `budgetLimits?.overall
?? null` and spreads via `{...(budgetLimits ?? {})}` throughout `commit()`,
matching `BudgetPage.jsx`'s existing defensive pattern.

### Bug #2 (missing decimal-place validation on the budget limit field) — FIXED, confirmed live

Entered `1200.005`, `99.995`, and `10.999` into the Monthly Budget Limit
field (the exact `.xx5`-boundary values the prior report couldn't test
without a JS runtime). All three were rejected with "Enter an amount with
at most 2 decimal places." — the field's error message, `AMOUNT_PATTERN`
now present in the source — and none of them were written to
`localStorage`, which still held the previous valid value in each case. No
silent floating-point mis-rounding occurs.

## Needs-live-verification items from the prior report — status

1. Rendered contrast of under/over indicators, light and dark — **confirmed
   in light mode** (distinct computed `color`/`background-color` values on
   `.budget-status-over` vs. plain text) **and dark mode** (spot-checked
   the over-budget case only; under-budget dark-mode contrast was not
   separately spot-checked, though it uses the same token pattern).
2. Full click-through of Previous/Next/"Back to current period" against
   real data — **confirmed**, across three periods (previous month, current
   month, next month), each showing its own correct expense total.
3. Setting a budget limit, reloading, and confirming it re-populates —
   **confirmed**.
4. Floating-point rounding edge case with concrete `.xx5` inputs — **confirmed
   fixed**: these are rejected outright, not mis-rounded (see Bug #2 above).
5. Keyboard/focus behavior of the new nav buttons — **still open, not
   covered in this pass** (only click-driven interaction was scripted; no
   dedicated Tab-order/focus-visible check was run against these
   specific buttons).
6. Regression pass of existing Expenses/Configuration behavior — **partially
   covered as a side effect**: this pass added 6 expenses, deleted an
   expense type, and edited the budget limit field through the real
   Expenses and Configuration screens with zero console/page errors, but
   this was not a dedicated regression pass against those screens'
   own prior QA'd scenarios (e.g. delete-confirmation, modal focus trap,
   field-level ARIA wiring from `QA-report-2026-09-11-post-audit-fixes.md`)
   — nothing in this pass suggested a regression, but they weren't
   re-exercised directly.

## Bugs found

None new. Both bugs carried over from the prior report are now fixed and
verified live (see above). No other issues were observed during this pass.

## Conclusion

All scenarios exercised passed, including the boundary case explicitly
called out in this task (spend exactly equal to the limit reads as
**under**, not over) and the deleted-expense-type grouping case. The
production build is clean, the full unit suite passes, and both
previously-flagged code bugs in `BudgetLimitSettings.jsx` are now fixed and
confirmed against the running app, not just by reading source. The two
remaining open items are narrow: a dedicated keyboard/focus check on the
Budget screen's new buttons, and a full re-run of the existing
Expenses/Configuration regression scenarios (as opposed to incidentally
exercising those screens, which produced no errors here).
