# QA Report — 2026-09-11 — Budget Period Spending Summary

## Scope

New feature: the **Budget** screen (`src/pages/BudgetPage.jsx`), a new
**Monthly Budget Limit** Configuration setting (`src/components/BudgetLimitSettings.jsx`),
and the third top-nav button wiring it all together (`src/App.jsx`,
`src/pages/ConfigurationPage.jsx`). Covers all 8 user stories in
`docs/user-stories.md`.

## Method — deviation from this project's usual QA process, please read

**This is a static code review, not a live Playwright pass**, unlike every
prior report in this folder. The environment this review was run in has no
Node.js, npm, or git installed, so none of the following were possible:
`npm test`, `npm run build`, `npm run preview`, or scripting a real browser
against the running app. No commands were run against the actual project
other than reading files.

Instead, each user story's Given/When/Then criteria was traced by hand
through the actual source: `src/pages/BudgetPage.jsx`,
`src/components/BudgetLimitSettings.jsx`, `src/App.jsx`,
`src/pages/ConfigurationPage.jsx`, `src/index.css`/`src/App.css`, and the
reused utilities (`src/utils/period.js`, `src/hooks/useExpenses.js`,
`src/hooks/useLocalStorageState.js`, `src/utils/format.js`,
`src/components/ExpenseList.jsx`, `src/utils/expenseValidation.js`,
`src/utils/expensesDb.js`).

Every verdict below is either:
- **PASS** — confirmed by reading the exact lines of code that implement the
  behavior; no guessing.
- **NEEDS LIVE VERIFICATION** — the criterion depends on actual rendering,
  visual appearance, or real-browser/user interaction that cannot be
  confirmed by reading source alone.

No pass/fail claim below is based on running the app. **A live Playwright
pass against a real build should still be done once Node is available on
this machine**, per this project's normal QA convention — see the "Needs
live verification" section at the end for exactly what that pass should
check.

## Results by user story

### Story 1 — Set an overall monthly budget limit — **PASS**

Traced in `BudgetLimitSettings.jsx`:
- Empty-by-default field: `draftFromOverall(null)` returns `""` (line 3-5);
  `ConfigurationPage.jsx` defaults `config.budgetLimits` to `{ overall: null }`
  when nothing is stored yet. Confirmed.
- Positive number commits on blur/Enter, rounded to 2 decimals: `commit()`
  (lines 22-37) runs on `onBlur`, and `onKeyDown` blurs the field on Enter
  (line 61), calling `setBudgetLimits({ ...budgetLimits, overall: Math.round(num * 100) / 100 })`.
  Confirmed.
- Clearing the field sets `overall` to `null`, not `0`: lines 24-28 handle
  the empty-trimmed case explicitly before any numeric parsing. Confirmed.
- `0`, negative, or non-numeric input shows the inline error and reverts the
  draft to the last saved value: lines 30-34, error text matches the spec's
  suggested wording exactly ("Enter a positive amount, or leave blank for no
  limit."), and `setDraft(draftFromOverall(budgetLimits.overall))` reverts
  to the last **saved** value (not the invalid typed value), consistent with
  `ExpenseTypesManager`'s `TypeRow` revert pattern. Confirmed.
- Persists across reload: goes through `useLocalStorageState`, the same
  mechanism already used (and QA-passed) for `config.startDay` and
  `config.expenseTypes`. Confirmed by code; no reason to expect this key
  behaves differently.

Minor inaccuracy (not a functional bug): the code comment above the
component (`BudgetLimitSettings.jsx` line 9-11) says it commits "same
pattern as PeriodSettings' start-day field," but `PeriodSettings`'s start-day
input (`PeriodSettings.jsx` line 43-50) actually commits on every keystroke
(`onChange`, no `onBlur`), not on blur/Enter. The *actual* commit-on-blur/Enter
behavior implemented here is correct per the user story text — only the
comment's comparison is wrong.

### Story 2 — View spending, no budget set — **PASS**

`BudgetPage.jsx`:
- `overall = budgetLimits?.overall ?? null`; `budgetStatus` is `"none"` when
  `overall == null` (lines 80-81), rendering "No budget set for this
  period." plus a button that calls `onGoToConfiguration` (lines 122-129),
  which `App.jsx` wires to `setScreen("configuration")` (line 40). Total,
  date range, and breakdown are computed and displayed unconditionally
  regardless of budget status. Confirmed.
- No expenses at all: `totalSpent` reduces to `0` → `formatAmount(0)` →
  `"0.00"` (`format.js` lines 6-10); `breakdown.length === 0` renders "No
  expenses logged in this period yet." (line 147), matching the spec's
  exact suggested wording. Confirmed — not an error state, a normal empty
  render path.

### Story 3 — Under budget — **PASS** (logic), color contrast **NEEDS LIVE VERIFICATION**

- `budgetStatus = "under"` when `totalSpent <= overall` (line 81) — the
  boundary case (`totalSpent === overall`) is included in `"under"` because
  `<=` is inclusive, exactly per spec. The message computes remaining as
  `overall - totalSpent`, giving `0.00` at the boundary. Confirmed by code.
- Message text matches spec: `"{spent} of {limit} — {remaining} remaining"`
  (lines 130-135).
- "Visually distinct" — `.budget-status-under` uses `var(--success-soft)` /
  `var(--success)` (green tokens) vs. `.budget-status-over`'s
  `var(--danger-soft)` / `var(--danger)` (red tokens) — `App.css` lines
  519-527, tokens defined for both light and dark mode in `index.css`
  (lines 11-12, 27-28). The correct *class* is assigned in the correct
  condition (confirmed statically), but actual rendered color/contrast in a
  real browser (and dark-mode toggle behavior) needs a live check.

### Story 4 — Over budget — **PASS** (logic), color contrast **NEEDS LIVE VERIFICATION**

- `budgetStatus = "over"` when `totalSpent > overall` (line 81); message
  computes `totalSpent - overall` as the over amount (lines 136-141),
  matching the spec's example wording exactly (aside from the app's known,
  explicit lack of thousands-separator formatting, which is out of scope
  per `docs/requirements.md`). Confirmed by code.
- Same visual-distinctness caveat as Story 3 — class assignment confirmed
  statically, rendered appearance needs a live check.

### Story 5 — Per-type spending breakdown — **PASS**

- Rows are built only from expense types actually present in the period's
  expenses (`BudgetPage.jsx` lines 60-78) — types with zero spend are never
  iterated, so they're correctly never shown as `$0.00` rows. Confirmed.
- Expenses whose `expenseTypeId` doesn't match any current
  `config.expenseTypes` entry are grouped under a single `"deleted"` key
  with label `"Deleted category"` and color `#9aa1af` (lines 63-72) — this
  is the **exact same label and hex color** used by `ExpenseList.jsx`
  (lines 30-31, 39) for the same fallback, so the convention is genuinely
  reused, not just visually similar. Multiple different deleted
  `expenseTypeId`s correctly collapse into one "Deleted category" subtotal
  (single `"deleted"` map key), matching the spec's "grouped under a subtotal"
  wording. Confirmed.
- Breakdown rows are plain `<div>`/`<span>` markup with no click handler or
  interactive element (lines 150-157) — genuinely read-only, no
  click-to-edit affordance exists to accidentally trigger. Confirmed.

### Story 6 — Navigate to the previous period — **PASS**

`goPrevious` calls `setPeriod(p => shiftPeriod(p, startDay, -1))` (lines
39-41), a functional update against whatever period is currently displayed
(not just the initial "current" period), so repeated clicks correctly keep
walking backward with no lower bound — `shiftPeriod`/`periodFor` themselves
have no bound (`period.js`, already unit-tested separately). `periodExpenses`,
`totalSpent`, and `breakdown` are all `useMemo`s keyed on `period`, so they
recompute automatically on every navigation. Confirmed.

### Story 7 — Navigate to the next period — **PASS**

- `goNext` mirrors `goPrevious` with `delta: 1` (lines 42-44). A future
  period with no expenses naturally produces `periodExpenses = []`, hitting
  the same zero-state as Story 2 (empty breakdown message, `$0.00` total) —
  not a distinct/error code path. Confirmed.
- "Back to current period" affordance: `isCurrentPeriod` compares
  `period.start.getTime()` against a separately-memoized `currentPeriod`
  (line 37); when they differ, a "Back to current period" button renders
  and calls `goToCurrentPeriod` (lines 45-47, 105-109). Confirmed.

One edge case worth flagging (see Bugs Found #3): `currentPeriod` is
computed once via `useMemo(() => periodFor(new Date(), startDay), [startDay])`
— it does not re-evaluate `new Date()` on a timer, only when `startDay`
changes or the component remounts.

### Story 8 — Period navigation respects the configured start day — **PASS**

`App.jsx` renders each screen with `{screen === "budget" && <BudgetPage ... />}`
(conditional rendering, mutually exclusive across the three screens) —
navigating away from Budget unmounts the `BudgetPage` instance entirely, and
navigating back mounts a **new** instance. On that fresh mount,
`useLocalStorageState("config.startDay", 1)` re-reads `localStorage` from
scratch, `currentPeriod` is recomputed via `useMemo` with the new
`startDay`, and `period` state is re-initialized to that fresh
`currentPeriod` (lines 30, 34-35). So changing the start day in
Configuration and returning to Budget is guaranteed to reflect the new
value — there is no stale closure or cached state that could carry the old
`startDay` across the navigation. Confirmed by tracing React's
mount/unmount semantics for conditionally-rendered JSX, which is
deterministic and doesn't require a live check to be confident about.

## Bugs / risks found beyond the user stories

Ordered by priority. All are **confirmed by code reading** unless noted
otherwise; none were fabricated or guessed.

### 1. (Medium) `BudgetLimitSettings.jsx` will crash the whole Configuration screen if `config.budgetLimits` is ever a non-object value in storage

`BudgetPage.jsx` defensively reads the limit as `budgetLimits?.overall ?? null`
(line 80) — safe even if `budgetLimits` itself is `null` or some unexpected
non-object value. `BudgetLimitSettings.jsx`, by contrast, accesses
`budgetLimits.overall` **without** optional chaining, in three places:
the initial `useState` (line 15), the sync `useEffect` (line 19), and
implicitly via the `{...budgetLimits, ...}` spread pattern used throughout
`commit()`. If `config.budgetLimits` in `localStorage` were ever stored as
a bare `null` (or any other non-object) instead of the documented
`{ overall: null | number }` shape, `budgetLimits.overall` throws
`TypeError: Cannot read properties of null (reading 'overall')` on the
very first render, crashing the entire Configuration page (not just the
budget section) — worse than `useLocalStorageState`'s own JSON-parse
failure handling, which degrades gracefully to `initialValue`.

Likelihood is low under normal use — every write path in this app writes
`{overall: ...}` as an object, never a bare scalar — but it's reachable via
manual `localStorage` tampering (devtools) or a future data migration bug,
and the requirements doc's own data-model section doesn't rule out
`config.budgetLimits` needing forward-compatible defensive reads the way
`overall` itself explicitly does ("`overall` is `null` or the key absent...
both must be treated as 'no budget set'"). Recommend the same
`budgetLimits?.overall` optional-chaining used in `BudgetPage.jsx` be
applied here too.

### 2. (Low) Budget limit input skips the "at most 2 decimal places" format check that expense amounts get, reopening a floating-point rounding pitfall

`expenseValidation.js`'s `AMOUNT_PATTERN` (`/^\d+(\.\d{1,2})?$/`, line 4)
**rejects** an amount string with more than 2 decimal places outright
("Amount can have at most 2 decimal places.") before `ExpenseForm.jsx` ever
applies `Math.round(Number(form.amount) * 100) / 100` (line 70) — so by the
time that rounding runs on an expense amount, the input is already
guaranteed to have ≤2 decimal places, making the rounding a safe no-op.

`BudgetLimitSettings.jsx`'s `commit()` has no equivalent format check — it
only rejects `NaN` or `<= 0` (line 30) — so a value with 3+ decimal places
(e.g. typed directly into the `type="number"` field, which HTML5 permits as
long as it's a syntactically valid float, `step="0.01"` notwithstanding)
reaches `Math.round(num * 100) / 100` (line 36) unfiltered. This is the
well-documented JavaScript floating-point idiom where `Math.round(x * 100) / 100`
can round the wrong way for certain `.xx5`-boundary inputs (e.g.
`Math.round(1.005 * 100) / 100` famously evaluates to `1` instead of `1.01`,
because `1.005` isn't exactly representable in binary floating point).

This is a real gap relative to the requirement that budget-limit rounding
follow "the same normalization as expense amount" — the expense-amount
convention actually *rejects* extra decimal places with a clear error
rather than silently rounding them, and `BudgetLimitSettings` does neither
(no rejection, and rounding that isn't guaranteed correct for all inputs).
**I could not verify a concrete triggering value without a JS runtime**
(no Node available in this environment) — the missing format-validation gap
itself is confirmed by reading the code side-by-side, but which exact
inputs mis-round needs a live check once Node/a browser console is
available (e.g. try `1200.005` and similar `.xx5` values in the field and
confirm the saved/reloaded value).

### 3. (Low) "Current period" comparison can go stale if the Budget screen is left open across a period boundary

`currentPeriod` (`BudgetPage.jsx` line 34) is computed once per mount via
`useMemo(() => periodFor(new Date(), startDay), [startDay])`. If a user
opens the Budget screen and leaves the tab/app open without navigating away
(e.g., across midnight on a day that starts a new period), `currentPeriod`
— and therefore `isCurrentPeriod` and the "Back to current period" link's
visibility — won't update until the component remounts (i.e., until the
user navigates to another screen and back, per Story 8's unmount/remount
behavior). Low severity: this only affects the "am I looking at today's
period" indicator, not data correctness, and is fixed by any navigation
away and back.

### 4. (Low, cosmetic/math) Per-category breakdown subtotals aren't rounded the same way the grand total is

`totalSpent` is explicitly rounded to cents via `Math.round(sum * 100) / 100`
(line 57), but each `breakdown` row's `amount` is accumulated via a raw
`+=` with no equivalent rounding step (line 67). Both ultimately pass
through `formatAmount()`'s `.toFixed(2)` for display, which masks this in
the overwhelming majority of cases, but the two values can theoretically
diverge by a cent from accumulated floating-point drift when there are
several categories, if a particular combination of amounts trips a
`toFixed` rounding boundary independently for the sum-then-round total vs.
the per-category running total. This wasn't observed in any real scenario
(no runtime available to test it) — flagged as a latent code-quality risk
rather than a confirmed visible bug.

### 5. (Informational, no action needed for this pass) No new unit tests were added for the aggregation logic

`docs/TECHNICAL.md` describes `period.js` as being "kept framework-free...
and fully unit-tested" specifically because date/aggregation math is
error-prone. The new period-filtering, total, and breakdown logic in this
feature lives inline in `BudgetPage.jsx`'s `useMemo` blocks rather than as
an extracted, independently unit-tested pure function — a minor gap
relative to this project's own stated convention, not a bug. Not blocking,
since `period.js` itself (which this feature relies on) is already
unit-tested and untouched by this change.

## Needs live verification once Node is available

None of the following were fabricated as pass/fail — they are simply
untestable from source alone and should be run through this project's
normal Playwright-against-a-production-build process before shipping:

1. Actual rendered appearance/contrast of the under-budget (green) vs.
   over-budget (red) indicators in both light and dark mode (Stories 3, 4).
2. A full click-through of Previous/Next/"Back to current period" against
   real IndexedDB expense data across several periods, confirming the
   figures update on-screen exactly as the code implies (Stories 6, 7).
3. Setting a budget limit, reloading the app, and confirming the persisted
   value re-populates the field (Story 1's reload criterion) — logically
   sound per `useLocalStorageState`'s existing, already-QA'd mechanism, but
   not independently re-verified live for this new key.
4. The floating-point rounding edge case in Bug #2 above with concrete
   `.xx5`-style inputs (e.g. `1200.005`, `99.995`).
5. Keyboard/focus behavior of the new Previous/Next/"Back to current
   period"/"Set one in Configuration" buttons (no ARIA anti-patterns were
   introduced by reading the markup, but this wasn't exercised live).
6. A regression pass of the existing Expenses/Configuration suites to
   confirm the new third nav button and `BudgetLimitSettings` section don't
   interfere with any prior QA'd behavior (nothing in the code trace
   suggests they would — `ConfigurationPage.jsx` simply appends a new
   independent `<section className="card">`, and `App.jsx`'s nav/screen
   switch is unchanged in structure — but this project's convention is to
   confirm via a live regression pass, not code reading alone).

## Conclusion

All 8 user stories check out against the actual implementation by static
code trace — no FAILs found. Two confirmed-by-reading, non-blocking gaps
are worth fixing before or shortly after ship: the missing optional
chaining in `BudgetLimitSettings.jsx` (Bug #1) and the missing
decimal-place format check on the budget limit field (Bug #2). Given the
environment constraint (no Node/npm/git available for this pass), **this
should not be treated as a substitute for the project's normal live
Playwright QA pass** — it should still be run, covering at minimum the
items in "Needs live verification" above, before this feature ships.
