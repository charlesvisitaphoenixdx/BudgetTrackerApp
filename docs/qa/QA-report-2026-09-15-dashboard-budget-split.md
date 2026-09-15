# QA Report — 2026-09-15 — Dashboard/Budget Section Split

## Scope

New feature: `DashboardPage.jsx` is restructured into two visually
distinct groups on the same screen — **"Budget"** (period navigation,
Selected Period total/indicator, By Category breakdown, always computed
across all expense types) and **"Dashboard Widgets"** (the expense-type
filter, Spending Trend, Top Categories, filter-scoped exactly as before).
The core behavior change is that the type filter no longer reaches into
the Budget group. Covers Stories 19-21, the updated Story 16/18, and the
"superseded" notes on Stories 15/17 in `docs/user-stories.md`, and the
"Feature: Dashboard/Budget Section Split" section of `docs/requirements.md`.

## Method

Standard project convention: unit tests (Vitest), a production build, then
`vite preview` serving the built app, driven by a headless Chromium browser
via Playwright — real clicks/typing/reloads/navigation, not just reading
code. Playwright (not a project dependency) was already cached on this
machine from a prior session (`ms-playwright/chromium-1243`); the
`playwright` npm package itself was loaded directly from the local npx
cache rather than reinstalling. Script: `qa_dashboard_split.mjs` (session
scratchpad), plus a small screenshot script for a visual light/dark-mode
check.

Each Playwright run started from a clean slate (`localStorage.clear()` +
IndexedDB database deletion) before seeding data through the real UI (not
directly written to storage), to exercise the same code paths a real user
would.

## Results

**Unit tests:** 32/32 passed (`period.test.js` 9, `expenseValidation.test.js` 23) —
unaffected by this feature, no regressions.

**Production build:** succeeded with no errors or warnings beyond the
normal PWA precache summary.

**Playwright suite: 20/20 test cases passed.** No JavaScript console
errors or uncaught runtime errors were observed during the run.

### New: Dashboard/Budget section split

| ID | Case | Result |
|----|------|--------|
| TC-1 | Two groups ("Budget", "Dashboard Widgets") render in order, separated by a `<hr class="dashboard-divider">` | PASS |
| TC-1b | Group titles read exactly "Budget" / "Dashboard Widgets" | PASS |
| TC-9 | Card titles ("Selected Period", "By Category", "Spending Trend", "Top Categories") render as `<h3>` | PASS |
| TC-9b | Group titles ("Budget", "Dashboard Widgets") render as `<h2>` | PASS |
| TC-2 | Budget group contains period nav (Previous/Next) and the Selected Period total | PASS |
| TC-2b | Total exactly equal to the budget limit ($80.00 of $80.00) shows the "under" (inclusive-boundary) status, not "over" | PASS |
| TC-2c | By Category shows the full all-types breakdown (Groceries $50.00, Transport $30.00) | PASS |
| **TC-3** | **Critical regression check:** setting the type filter to "Groceries" leaves the Budget group's total ($80.00), status ("under"), and By Category breakdown (still both rows) completely unchanged | **PASS** |
| TC-4 | With filter = Groceries: Spending Trend narrows to Groceries-only figures (current period row drops from $80.00 to $50.00) and Top Categories is hidden | PASS |
| TC-5 | Switching the filter back to "All types": Top Categories reappears, Spending Trend returns to $80.00 | PASS |
| TC-6 | Navigating Previous to a prior period while the filter is set to "Groceries": Budget group shows that period's all-types data ($20.00, Utilities), unaffected by the filter throughout | PASS |
| TC-8 | Zero-expense period: Budget group shows $0.00, "No expenses logged in this period yet.", and the indicator still evaluates ("under") | PASS |
| TC-6b | After navigating back to the current period, "Back to current period" correctly disappears | PASS |
| TC-7 | Deleting the currently-filtered "Groceries" type in Configuration and returning to Dashboard resets the filter to "All types" (dropdown option removed); the affected expenses show as "Deleted category" in the Budget group's breakdown, still counted in the total | PASS |
| TC-7b | Budget group's current-period total stays $80.00 after the category deletion (deleted-category expense still counted) | PASS |

### Regression (existing Dashboard/Budget behavior + core CRUD)

| ID | Case | Result |
|----|------|--------|
| TC-R1 | Editing a logged expense (Transport $30.00 → $35.00) persists | PASS |
| TC-R2 | Deleting a logged expense removes its row | PASS |
| TC-R3 | Adding a new expense still works | PASS |
| TC-R4 | Total exceeding the budget limit ($100.00 of $80.00) shows the "over" status with the correct over-amount | PASS |
| TC-R5 | Configuration's Monthly Budget Limit field still shows the persisted value across navigation | PASS |

A light-mode and dark-mode screenshot of the fully rendered Dashboard was
also captured directly (not just asserted via DOM query) to confirm the
group headings, divider, and card hierarchy are legible and not visually
broken in either color scheme — both rendered cleanly with the "Budget"/
"Dashboard Widgets" small-caps group labels clearly distinct from the
bolded `<h3>` card titles.

## Bugs found

None. All 20 scripted scenarios passed on the first fully-instrumented
run (two initial script-side timing races — reading DOM state before an
async `useExpenses()` load/IndexedDB write settled — were script bugs, not
application bugs; adding explicit waits for the relevant elements resolved
them and the underlying assertions still passed).

## Notes / behavior confirmed by testing

- The critical filter-decoupling change (Story 20) works exactly as
  specified: `selectedTotal`, `budgetStatus`, and `selectedBreakdown` in
  `DashboardPage.jsx` no longer read `filterTypeId` at all, and this was
  confirmed live — not just by reading the `useMemo` dependency arrays —
  across multiple periods and with the filter both on and off.
- The Budget group's over/under boundary rule (spend exactly equal to the
  limit is "under") still holds after the restructure, matching Story 21
  and the original Story 3 behavior.
- The "By Category" card breakdown correctly always renders (no longer
  guarded by `filterId === "all"`) and still groups unresolved
  `expenseTypeId`s under "Deleted category" per Story 5/18, confirmed both
  in isolation and combined with the Budget group's filter-independence.
- Story 18's filter-reset-on-type-deletion behavior still holds; since
  `DashboardPage` fully unmounts/remounts on screen navigation (per
  `App.jsx`'s conditional rendering), the filter naturally resets to "all"
  on return to Dashboard regardless, and this was verified end-to-end
  rather than assumed from that architectural fact alone.
- Heading hierarchy renders correctly: group titles are `<h2>` styled as
  small-caps accent-colored labels, card titles are `<h3>` in normal bold
  weight — visually and semantically distinct, confirmed both via DOM
  query and direct screenshot in light and dark mode.

## Conclusion

The Dashboard/Budget Section Split feature works as specified with no
regressions found. The critical behavior change — decoupling the
expense-type filter from the Budget group — is implemented correctly and
verified live. Safe to ship.
